/**
 * Feature flags da aplicação.
 *
 * Convenção: nomes em SCREAMING_SNAKE_CASE no env. Default sempre OFF.
 *
 * Pivô V2 (28/04/2026): controla rollout do novo modelo
 * (afiliação 1-nível, Founder@5, comissão 50%, créditos Shopify).
 * Ver docs/sdd/PIVOT-V2.md.
 */

const isTrue = (v: string | undefined): boolean =>
  v?.toLowerCase() === 'true' || v === '1'

export const featureFlags = {
  /** Rollout do modelo v2 (afiliação 1-nível, Founder, comissão 50%). Default OFF. */
  LRP_V2: isTrue(process.env.LRP_V2),

  /** Desliga cron jobs do v1 (close-monthly-cv, network-compression). Acionar com LRP_V2. */
  CRON_DISABLED_V2: isTrue(process.env.CRON_DISABLED_V2),
} as const

export const isV2Enabled = (): boolean => featureFlags.LRP_V2

export const isV1CronDisabled = (): boolean => featureFlags.CRON_DISABLED_V2
