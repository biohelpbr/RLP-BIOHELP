import { isV2Enabled } from "@/lib/utils/featureFlags"
import V1Admin from "./V1Admin"
import V2Admin from "./V2Admin"

/**
 * `/admin` — switch v1/v2 via feature flag LRP_V2.
 *
 * Server Component. Quando flag OFF (default), renderiza V1Admin (painel
 * MLM/CV legado). Quando ON, renderiza V2Admin (F-V16 — pivô V2).
 */
export default function AdminPage() {
  return isV2Enabled() ? <V2Admin /> : <V1Admin />
}
