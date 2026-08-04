import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"

import { createPublicReadClient } from "@/lib/supabase/server"
import { DEFAULT_CREATORS_HUB_LINKS, type CreatorsHubLinks } from "@/lib/settings/queries"

import { ConviteBiohelp } from "./ConviteBiohelp"
import { ConviteCreatorsHub } from "./ConviteCreatorsHub"

interface ConvitePageProps {
  params: Promise<{ ref_code: string }>
}

/**
 * ISR: a página passa a ser gerada uma vez e servida da borda da Vercel,
 * regenerando a cada 60s. Sem isto a rota é dinâmica (ƒ) e roda uma função por
 * visita — o que não escala em pico de campanha.
 */
export const revalidate = 60
export const dynamicParams = true

/**
 * Vazio de propósito: nenhuma página é gerada no build (são centenas de códigos
 * e eles mudam). Com `dynamicParams`, a primeira visita a cada código gera a
 * página, e as seguintes vêm prontas da borda até a revalidação.
 */
export function generateStaticParams() {
  return [] as { ref_code: string }[]
}

/**
 * Resolve tudo que a landing precisa (padrinho + funil) com cache de 60s.
 *
 * Por quê: esta é a página que recebe o tráfego de campanha, e o conteúdo dela
 * praticamente não muda. Sem cache, cada visitante gerava 2 consultas ao banco
 * — o gargalo em pico de lançamento. `createServiceClient` força `no-store` em
 * todo fetch (proposital, pra não quebrar agregações em outras telas), então o
 * cache tem que ser aqui, na função, e não na rota.
 *
 * Efeito colateral aceito: mudanças (padrinho cancelado, lista de códigos do
 * Creators Hub editada no admin) levam até 60s pra refletir.
 */
const carregarConvite = unstable_cache(
  async (refCode: string) => {
    // Cliente sem `no-store` — ver createPublicReadClient. Com o service client
    // padrão a rota volta a ser dinâmica e o ISR não acontece.
    const supabase = createPublicReadClient()

    const [rSponsor, rSetting] = await Promise.all([
      supabase
        .from("members")
        .select("ref_code, name, subscription_status")
        .eq("ref_code", refCode)
        .maybeSingle(),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "creators_hub_links")
        .maybeSingle(),
    ])

    // CRÍTICO: erro de consulta NÃO é "código inexistente". Se retornássemos
    // null aqui, o unstable_cache guardaria um 404 por 60s pra TODO visitante
    // (aconteceu em produção, 04/08). Lançar faz o ISR manter a última versão
    // boa da página; o 404 fica reservado pra ausência real de dados.
    if (rSponsor.error) throw new Error(`convite: falha ao consultar padrinho (${rSponsor.error.message})`)
    const sponsor = rSponsor.data
    if (!sponsor || sponsor.subscription_status === "cancelled") return null

    // Settings com erro não derruba a página: cai nos defaults.
    const setting = rSetting.error ? null : rSetting.data

    const salvos = (setting?.value ?? null) as Partial<CreatorsHubLinks> | null
    const codigos =
      Array.isArray(salvos?.ref_codes) && salvos.ref_codes.length > 0
        ? salvos.ref_codes.map((c) => String(c).trim())
        : DEFAULT_CREATORS_HUB_LINKS.ref_codes

    const codigo = sponsor.ref_code as string
    return {
      refCode: codigo,
      sponsorName: (sponsor.name as string | null) ?? "alguém especial",
      creatorsHub: codigos.some((c) => c.toUpperCase() === codigo.toUpperCase()),
    }
  },
  ["convite-landing"],
  { revalidate: 60, tags: ["convite"] },
)

/**
 * Landing de convite. Dois funis convivem (cliente, 28/07):
 *   • Creators Hub — só para os códigos em `creators_hub_links.ref_codes`
 *     (hoje ADMIN002). Visual novo + oferta própria + página de obrigado.
 *   • Nutrition Club — padrão para todos os outros convites.
 * A lista é editável em /admin/settings, sem deploy.
 */
export default async function ConvitePage({ params }: ConvitePageProps) {
  const { ref_code } = await params

  const convite = await carregarConvite(ref_code)
  if (!convite) notFound()

  if (convite.creatorsHub) {
    return <ConviteCreatorsHub refCode={convite.refCode} />
  }
  return <ConviteBiohelp refCode={convite.refCode} sponsorName={convite.sponsorName} />
}
