import { recompute } from "./auto-classifier"

/**
 * F-V18 hook stub — chamado quando o status efetivo de um membro muda.
 *
 * **S3 (atual):** STUB. Não está wired em lugar algum porque F-V03
 * (subscription_status = 'paid') ainda não foi implementada. A view
 * `member_active_affiliate_count` usa `status='active'` como proxy;
 * mudanças de status disparariam o cron diário, sem hook em tempo real.
 *
 * **S5+ (quando F-V03 entrar):** wire este hook ao trigger de update
 * de `subscription_status` em `members`. Sequência:
 *   1. F-V03 atualiza members.subscription_status = 'paid' | 'cancelled'.
 *   2. Trigger pg_notify ou edge function chama esta função com sponsor_id.
 *   3. recompute(sponsor_id) atualiza tags do sponsor sem esperar cron.
 *
 * Mantém a regra: quem ganha/perde "ativos" é o sponsor (member.sponsor_id),
 * então é o sponsor que precisa recompute, não o membro cuja assinatura mudou.
 */
export async function onMemberStatusChange(opts: {
  memberId: string
  sponsorId: string | null
  newStatus: string
}): Promise<void> {
  // S3: stub — nada a fazer enquanto F-V03 não estiver live.
  // S5+: descomentar e remover o early return.
  if (process.env.LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE !== "true") {
    return
  }

  if (!opts.sponsorId) return

  try {
    await recompute(opts.sponsorId)
  } catch (err) {
    console.error("[hook-on-status-change] recompute failed", opts, err)
    // Não lança — falha de hook não deve quebrar o fluxo de update do status.
  }
}
