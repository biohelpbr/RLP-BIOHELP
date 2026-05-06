import { isV2Enabled } from "@/lib/utils/featureFlags"
import V1AdminProducts from "./V1AdminProducts"
import V2AdminProducts from "./V2AdminProducts"

/**
 * `/admin/products` — switch v1/v2 via feature flag LRP_V2.
 *
 * Server Component. v1 = listagem Shopify completa (CV legado).
 * v2 = mais vendidos via F-V14 (S3); cadastro completo em S4.
 */
export default function AdminProductsPage() {
  return isV2Enabled() ? <V2AdminProducts /> : <V1AdminProducts />
}
