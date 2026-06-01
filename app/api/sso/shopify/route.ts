import { NextRequest, NextResponse } from "next/server"
import { verifyShopifyAppProxySignature } from "@/lib/sso/app-proxy"
import { resolveSsoMember } from "@/lib/sso/handler"
import { recordAuthAudit } from "@/lib/sso/audit"

export const dynamic = "force-dynamic"

/**
 * F-V17: SSO Shopify via App Proxy.
 *
 * Endpoint chamado pela Shopify quando cliente clica em link interno
 * tipo `https://<shop>/apps/clube`. Shopify adiciona signature + logged_in_customer_id.
 *
 * Doc: https://shopify.dev/docs/apps/build/online-store/display-dynamic-data
 *
 * Configuração:
 *   - Partner Dashboard → App Proxy → Sub-path prefix: `apps`, Sub-path: `clube`,
 *     Proxy URL: `https://rlp-biohelp.vercel.app/api/sso/shopify`.
 *   - LRP_V2_SSO=true ativa o endpoint (default OFF — gradual rollout).
 *
 * Fluxo:
 *   1. Verifica flag LRP_V2_SSO.
 *   2. Valida signature HMAC-SHA256 com SHOPIFY_API_SECRET.
 *   3. Lê logged_in_customer_id; se ausente → /login.
 *   4. Resolve member via shopify_customers; se ausente → /join.
 *   5. Gera magic link Supabase → 302 redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const params = url.searchParams

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  const userAgent = request.headers.get("user-agent")
  const shopDomain = params.get("shop")

  // 1. Flag gate
  if (process.env.LRP_V2_SSO !== "true") {
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "disabled",
      shopDomain,
      ip,
      userAgent,
    })
    return NextResponse.redirect(absoluteUrl("/login"))
  }

  // 2. Valida signature
  const secret = process.env.SHOPIFY_API_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "SHOPIFY_API_SECRET ausente" },
      { status: 500 }
    )
  }

  const verification = verifyShopifyAppProxySignature(params, secret)
  if (!verification.valid) {
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "invalid_signature",
      shopDomain,
      ip,
      userAgent,
      details: { reason: verification.reason },
    })
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    )
  }

  // 3. Lê logged_in_customer_id
  const customerId = params.get("logged_in_customer_id")
  if (!customerId) {
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "no_logged_in_customer",
      shopDomain,
      ip,
      userAgent,
    })
    return NextResponse.redirect(absoluteUrl("/login"))
  }

  // 4. Resolve member + magic link
  const result = await resolveSsoMember({
    shopifyCustomerId: customerId,
    shopDomain: shopDomain || "",
    ip,
    userAgent,
  })

  if (!result.ok) {
    if (result.reason === "member_not_found") {
      const ref = params.get("ref")
      // F-V19: SSO sem ref cai no /login (não tem rota /convite sem sponsor).
      // Com ref, landing nova /convite/<ref> substitui /join V1.
      const fallbackUrl = ref ? `/convite/${encodeURIComponent(ref)}` : "/login"
      return NextResponse.redirect(absoluteUrl(fallbackUrl))
    }
    return NextResponse.redirect(
      absoluteUrl(`/login?error=${encodeURIComponent(result.reason)}`)
    )
  }

  return NextResponse.redirect(result.redirectUrl)
}

function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SHOPIFY_APP_URL ||
    "http://localhost:3000"
  const trimmedBase = base.replace(/\/+$/, "")
  const trimmedPath = path.startsWith("/") ? path : `/${path}`
  return `${trimmedBase}${trimmedPath}`
}
