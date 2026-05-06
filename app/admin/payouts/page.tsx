import { isV2Enabled } from "@/lib/utils/featureFlags"
import V1AdminPayouts from "./V1AdminPayouts"
import V2AdminPayouts from "./V2AdminPayouts"

/**
 * `/admin/payouts` — switch v1/v2 via flag LRP_V2.
 *
 * Pattern §1 da memória S1/S2/S3: rota v1 já existia; em vez de criar
 * route group, fazemos switch interno preservando 100% do v1.
 */
export default function AdminPayoutsPage() {
  if (isV2Enabled()) return <V2AdminPayouts />
  return <V1AdminPayouts />
}
