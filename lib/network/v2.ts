/**
 * Network V2 — Visão restrita da rede pro membro (Pivô V2).
 *
 * No modelo v2 o membro vê apenas:
 * - Seu sponsor (1 nível pra cima)
 * - Seus indicados diretos N1 (1 nível pra baixo)
 *
 * Sem árvore recursiva, sem CV, sem níveis (Parceira/Líder/Diretora/Head).
 *
 * Feature: F-V11 (docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md)
 * Gated por feature flag: LRP_V2 (lib/utils/featureFlags.ts).
 */

import { createServiceClient } from '@/lib/supabase/server'
import { HOUSE_ACCOUNT_ID } from '@/lib/utils/ref-code'
import type {
  MemberStatus,
  SponsorInfo,
  DirectReport,
  MemberNetworkResponseV2,
} from '@/types/database'

// F-V03: a fonte de verdade de "ativo" é members.subscription_status
// (pending|paid|cancelled), não o campo legado status. Derivamos o MemberStatus
// exibido a partir dela — paid=>active, cancelled=>inactive, pending=>pending.
type SubscriptionStatusV2 = 'pending' | 'paid' | 'cancelled'

function statusFromSubscription(
  sub: SubscriptionStatusV2 | null | undefined
): MemberStatus {
  if (sub === 'paid') return 'active'
  if (sub === 'cancelled') return 'inactive'
  return 'pending'
}

interface MemberCoreRow {
  id: string
  name: string
  ref_code: string
  subscription_status: SubscriptionStatusV2 | null
  sponsor_id: string | null
}

interface DirectReportRow {
  id: string
  name: string
  ref_code: string
  subscription_status: SubscriptionStatusV2 | null
  created_at: string
}

export async function getMemberNetworkV2(
  memberId: string
): Promise<MemberNetworkResponseV2 | null> {
  const supabase = createServiceClient()

  // 1) Carrega o membro logado (filtra por id pra evitar exposição de dados alheios)
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, ref_code, subscription_status, sponsor_id')
    .eq('id', memberId)
    .single<MemberCoreRow>()

  if (memberError || !member) {
    console.error('[network-v2] Membro não encontrado:', memberId, memberError)
    return null
  }

  // 2) Carrega sponsor (se houver). Sponsor pode ser House Account ou null no topo.
  let sponsor: SponsorInfo | null = null
  if (member.sponsor_id) {
    const { data: sponsorRow } = await supabase
      .from('members')
      .select('id, name, ref_code, subscription_status')
      .eq('id', member.sponsor_id)
      .single<
        Pick<MemberCoreRow, 'id' | 'name' | 'ref_code' | 'subscription_status'>
      >()

    if (sponsorRow) {
      sponsor = {
        id: sponsorRow.id,
        name: sponsorRow.name,
        ref_code: sponsorRow.ref_code,
        status: statusFromSubscription(sponsorRow.subscription_status),
        is_house_account: sponsorRow.id === HOUSE_ACCOUNT_ID,
      }
    }
  }

  // 3) Carrega indicados diretos N1 (sem recursão).
  const { data: directReportsRows } = await supabase
    .from('members')
    .select('id, name, ref_code, subscription_status, created_at')
    .eq('sponsor_id', member.id)
    .order('created_at', { ascending: false })
    .returns<DirectReportRow[]>()

  const directReports: DirectReport[] = (directReportsRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    ref_code: r.ref_code,
    status: statusFromSubscription(r.subscription_status),
    created_at: r.created_at,
  }))

  return {
    version: 'v2',
    member: {
      id: member.id,
      name: member.name,
      ref_code: member.ref_code,
      status: statusFromSubscription(member.subscription_status),
    },
    sponsor,
    direct_reports: directReports,
  }
}
