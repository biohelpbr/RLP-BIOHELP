"use server"

import {
  createAdminClient,
  createServerSupabaseClient,
  getAuthUser,
} from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

/**
 * F-V28 — Define a nova senha do membro logado e LIMPA a flag de troca obrigatória.
 * Roda no contexto da sessão atual (a página /trocar-senha exige auth), então
 * pega o user da sessão e nunca aceita um userId do cliente.
 *
 * A senha é trocada pelo client COOKIE-AWARE da própria sessão (`updateUser`),
 * que mantém a sessão viva — assim a parceira cai direto no /dashboard sem ter
 * que logar de novo. A flag fica em `app_metadata` (só service role escreve),
 * então a limpeza usa o admin client. O middleware lê o valor fresco via getUser.
 */
export async function setNewPassword(newPassword: string): Promise<Result> {
  const user = await getAuthUser()
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const pwd = (newPassword ?? "").trim()
  if (pwd.length < 8) {
    return { ok: false, error: "A senha precisa ter pelo menos 8 caracteres." }
  }

  // 1) Troca a senha mantendo a sessão atual (não desloga).
  const supabase = await createServerSupabaseClient()
  const { error: pwErr } = await supabase.auth.updateUser({ password: pwd })
  if (pwErr) {
    console.error("[setNewPassword] updateUser", pwErr.message)
    return { ok: false, error: "Não foi possível salvar a nova senha. Tente novamente." }
  }

  // 2) Limpa a flag de troca obrigatória (app_metadata → service role).
  const admin = createAdminClient()
  const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { must_reset_password: false },
  })
  if (metaErr) {
    // Senha já trocada; só logamos. O middleware ainda pediria a troca de novo,
    // mas a senha nova já vale — o próximo salvar limpa a flag.
    console.error("[setNewPassword] clear flag", metaErr.message)
  }

  return { ok: true }
}
