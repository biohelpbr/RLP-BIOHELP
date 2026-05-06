import { isV2Enabled } from "@/lib/utils/featureFlags"
import V1Login from "./V1Login"
import V2Login from "./V2Login"

/**
 * `/login` — switch v1/v2 via feature flag LRP_V2.
 *
 * Server Component. Quando flag OFF (default), renderiza V1Login (form
 * roxo legado). Quando ON, renderiza V2Login (visual Loveable absorvido,
 * tabs Parceira/Admin Biohelp). Lógica de auth (signInWithPassword via
 * /api/auth/login) é a mesma — só visual mudou.
 */
export default function LoginPage() {
  return isV2Enabled() ? <V2Login /> : <V1Login />
}
