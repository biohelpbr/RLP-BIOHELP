import { isV2Enabled } from "@/lib/utils/featureFlags"
import V1Dashboard from "./V1Dashboard"
import V2Dashboard from "./V2Dashboard"

/**
 * `/dashboard` — switch v1/v2 via feature flag LRP_V2.
 *
 * Server Component. Quando flag OFF (default), renderiza V1Dashboard
 * (mesmo conteúdo MLM/CV de antes do pivô — funcionalmente intacto).
 * Quando ON, renderiza V2Dashboard (modelo afiliação 1-nível).
 */
export default function DashboardPage() {
  return isV2Enabled() ? <V2Dashboard /> : <V1Dashboard />
}
