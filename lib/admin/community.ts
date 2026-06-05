import { createServiceClient } from "@/lib/supabase/server"

// F-V03: a fonte de verdade de "ativo" é members.subscription_status
// (pending|paid|cancelled), não o campo legado status. As páginas admin
// (/admin/community e /admin/community/[id]) falam o vocabulário legado
// (active|pending|inactive) nos filtros e badges, então traduzimos aqui nas
// duas pontas sem alterar a UI.
type SubscriptionStatusV2 = "pending" | "paid" | "cancelled"
type LegacyStatus = "active" | "pending" | "inactive"

const LEGACY_TO_SUB: Record<LegacyStatus, SubscriptionStatusV2> = {
  active: "paid",
  pending: "pending",
  inactive: "cancelled",
}

const SUB_TO_LEGACY: Record<SubscriptionStatusV2, LegacyStatus> = {
  paid: "active",
  pending: "pending",
  cancelled: "inactive",
}

function legacyFromSubscription(sub: unknown): LegacyStatus {
  return SUB_TO_LEGACY[sub as SubscriptionStatusV2] ?? "pending"
}

export type CommunityMember = {
  id: string
  name: string
  email: string
  ref_code: string
  status: string
  created_at: string
  sponsor_id: string | null
  tags: string[]
  active_count: number
}

export type CommunityFilters = {
  status?: "active" | "pending" | "inactive" | "all"
  tag?: string
  /** Busca livre por nome / email / ref_code / telefone (F-V25). */
  search?: string
  page?: number
  pageSize?: number
}

/**
 * Sanitiza o termo de busca pro `.or()` do PostgREST (vírgula/parênteses são
 * separadores de sintaxe e quebrariam a query). Remove caracteres perigosos.
 */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()%*\\]/g, " ").trim()
}

export type CommunityList = {
  rows: CommunityMember[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 50

export async function listCommunity(filters: CommunityFilters = {}): Promise<CommunityList> {
  const supabase = createServiceClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? DEFAULT_PAGE_SIZE))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("members")
    .select(
      "id, name, email, ref_code, subscription_status, created_at, sponsor_id, tags",
      {
        count: "exact",
      }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (filters.status && filters.status !== "all") {
    query = query.eq("subscription_status", LEGACY_TO_SUB[filters.status])
  }

  if (filters.tag === "FOUNDER") {
    // FOUNDER é COMPUTADO (≥5 afiliados ativos — F-V06), NÃO uma tag em
    // members.tags. O badge usa active_count>=5; o filtro precisa fazer o mesmo.
    // Restringe a query aos member_ids elegíveis (view member_active_affiliate_count).
    const { data: founders } = await supabase
      .from("member_active_affiliate_count")
      .select("member_id")
      .gte("active_count", 5)
    const founderIds = (founders ?? []).map((r) => r.member_id as string)
    // Lista vazia → força 0 resultados sem quebrar o PostgREST (.in([]) é inválido).
    query = query.in("id", founderIds.length > 0 ? founderIds : ["00000000-0000-0000-0000-000000000000"])
  } else if (filters.tag) {
    // tags é jsonb — precisa serializar como JSON array, não Postgres array.
    // .contains() envia formato `cs.{...}` (incompatível com jsonb); usamos
    // .filter("cs", JSON.stringify([tag])) que envia `cs.["..."]`.
    query = query.filter("tags", "cs", JSON.stringify([filters.tag]))
  }

  // F-V25: busca livre (ilike) por nome / email / ref_code / telefone.
  const term = filters.search ? sanitizeSearch(filters.search) : ""
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,email.ilike.%${term}%,ref_code.ilike.%${term}%,phone.ilike.%${term}%`,
    )
  }

  const { data, error, count } = await query
  if (error) {
    console.error("[community.listCommunity]", error)
    return { rows: [], total: 0, page, pageSize }
  }

  const ids = (data ?? []).map((r) => r.id as string)
  const counts = await loadActiveCounts(ids)

  const rows: CommunityMember[] = (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? "",
    email: (r.email as string) ?? "",
    ref_code: (r.ref_code as string) ?? "",
    status: legacyFromSubscription(r.subscription_status),
    created_at: (r.created_at as string) ?? "",
    sponsor_id: (r.sponsor_id as string | null) ?? null,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    active_count: counts.get(r.id as string) ?? 0,
  }))

  return { rows, total: count ?? 0, page, pageSize }
}

async function loadActiveCounts(memberIds: string[]): Promise<Map<string, number>> {
  if (memberIds.length === 0) return new Map()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("member_active_affiliate_count")
    .select("member_id, active_count")
    .in("member_id", memberIds)
  if (error) {
    console.error("[community.loadActiveCounts]", error)
    return new Map()
  }
  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.member_id as string, Number(row.active_count ?? 0))
  }
  return map
}

export async function getCommunityMember(id: string) {
  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from("members")
    .select("id, name, email, ref_code, subscription_status, subscription_auto_renew, subscription_expires_at, created_at, sponsor_id, tags, phone, level")
    .eq("id", id)
    .single()
  if (!member) return null

  const [sponsorRes, countsRes, pendingCountRes, payoutsRes, leadsRes, salesRes, roleRes] = await Promise.all([
    member.sponsor_id
      ? supabase
          .from("members")
          .select("id, name, ref_code")
          .eq("id", member.sponsor_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("member_active_affiliate_count")
      .select("active_count")
      .eq("member_id", id)
      .single(),
    // Pedido Gabriel (call 03/06): além dos afiliados ativos, mostrar quantos
    // afiliados diretos (N1) estão com assinatura `pending` aguardando ativação.
    // Mesma população da view member_active_affiliate_count (sponsor_id = id),
    // só que filtrando subscription_status='pending' em vez de 'paid'.
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("sponsor_id", id)
      .eq("subscription_status", "pending"),
    supabase
      .from("payout_requests")
      .select("id, amount, status, payout_method, created_at")
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("member_leads")
      .select("*", { count: "exact", head: true })
      .eq("member_id", id),
    supabase
      .from("member_sales")
      .select("*", { count: "exact", head: true })
      .eq("member_id", id),
    // W2: o detalhe mostra/gerencia o acesso admin (tabela roles).
    supabase
      .from("roles")
      .select("role")
      .eq("member_id", id)
      .eq("role", "admin")
      .maybeSingle(),
  ])

  const sponsor = sponsorRes.data
  const counts = countsRes.data
  const pendingCount = pendingCountRes.count ?? 0
  const payouts = payoutsRes.data
  const leadsCount = leadsRes.count ?? 0
  const salesCount = salesRes.count ?? 0

  return {
    member: {
      id: member.id as string,
      name: (member.name as string) ?? "",
      email: (member.email as string) ?? "",
      ref_code: (member.ref_code as string) ?? "",
      status: legacyFromSubscription(member.subscription_status),
      subscription_status: (member.subscription_status as string | null) ?? null,
      subscription_auto_renew: (member.subscription_auto_renew as boolean | null) ?? null,
      subscription_expires_at: (member.subscription_expires_at as string | null) ?? null,
      created_at: (member.created_at as string) ?? "",
      sponsor_id: (member.sponsor_id as string | null) ?? null,
      tags: Array.isArray(member.tags) ? (member.tags as string[]) : [],
      phone: (member.phone as string | null) ?? null,
      level: (member.level as string | null) ?? null,
    },
    sponsor: sponsor as { id: string; name: string; ref_code: string } | null,
    activeCount: Number(counts?.active_count ?? 0),
    pendingCount,
    payouts: (payouts ?? []) as Array<{
      id: string
      amount: number
      status: string
      payout_method: string | null
      created_at: string
    }>,
    leadsCount,
    salesCount,
    isAdmin: roleRes.data?.role === "admin",
  }
}
