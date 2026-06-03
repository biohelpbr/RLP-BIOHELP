# F-V28 — Login alternativo com senha (provisória + troca obrigatória)

> **Classe:** D (mexe em auth)
> **Status:** Em DoR → Em Implementação
> **Branch:** `feat/F-V28-login-senha`
> **Origem:** call BioHelp&FlowCode 02/06 (Gabriel). Reavaliada e aprovada p/ implementar em 03/06.

## 1. Problema

Parceiras ativas (pagaram no Guru) às vezes não conseguem entrar porque o **código OTP por e-mail não chega** (spam / atraso / e-mail digitado errado no checkout). O Resend Pro (02/06) reduz a causa, mas o cliente quer um **caminho de emergência que não dependa do e-mail**: login com **senha**.

## 2. Solução (decisões travadas com o cliente 03/06)

1. **Admin gera senha provisória sob demanda** em `/admin/community/[id]` (1 clique).
2. A senha aleatória é **mostrada pro admin copiar** (repassar por WhatsApp) **e enviada por e-mail** (Resend) — redundância proposital.
3. Na `/login`, um **toggle** alterna entre **"Entrar com código"** (OTP, padrão atual) e **"Entrar com senha"**.
4. No **primeiro acesso com a senha provisória, a troca é obrigatória**: a parceira é redirecionada pra `/trocar-senha` antes de usar o painel. A provisória deixa de valer ao trocar.

## 3. Mecanismo (técnico)

- **Flag de troca pendente:** `app_metadata.must_reset_password` (boolean) no Supabase Auth user. Escolhido `app_metadata` (não `user_metadata`) porque só o service role escreve → o membro não consegue se "auto-liberar". **Sem migration** (não toca schema de `members`).
- **Gate de assinatura:** o login com senha **reusa** `/api/auth/check-email` (só `subscription_status='paid'` ou admin passam) — mesma regra do OTP.
- **Geração:** admin → `admin.updateUserById(authUserId, { password, app_metadata:{ must_reset_password:true } })`. Se o member ainda não tem `auth_user_id` (caso Guru), cria/linka via o mesmo padrão do `app/welcome/actions.ts` (createUser → fallback listUsers → grava `members.auth_user_id`).
- **Login senha:** `supabase.auth.signInWithPassword` client-side no `V2Login` (mesmo client cookie-aware do OTP).
- **Troca forçada:** middleware lê `user.app_metadata.must_reset_password`; se `true` e rota ≠ `/trocar-senha`, redireciona. `setNewPassword` (server action) faz `admin.updateUserById(userId, { password, app_metadata:{ must_reset_password:false } })`.

## 4. Feature Contract — arquivos permitidos

**Novos:**
- `lib/auth/provisional-password.ts` — `generateProvisionalPassword()` (crypto, sem chars ambíguos) + `sendProvisionalPasswordEmail()`.
- `app/admin/community/[id]/MemberPasswordActions.tsx` — botão + reveal da senha (client).
- `app/trocar-senha/page.tsx` — shell da página de troca forçada.
- `app/trocar-senha/ChangePasswordForm.tsx` — form (client).
- `app/trocar-senha/actions.ts` — `setNewPassword(newPassword)`.

**Editados:**
- `lib/admin/member-actions.ts` — `adminGenerateProvisionalPassword(memberId): { ok, password }`.
- `app/admin/community/[id]/page.tsx` — montar `MemberPasswordActions`.
- `app/login/V2Login.tsx` — toggle código/senha + `signInWithPassword`.
- `middleware.ts` — gate `must_reset_password` + `/trocar-senha` como rota autenticada.

**Fora do contrato → PARA.** Nada de schema (`members`), nada de RLS, nada no fluxo OTP existente.

## 5. Critérios de Aceite (CAs)

- **CA-1** Admin clica "Gerar senha provisória" em `/admin/community/[id]` → senha aleatória aparece pra copiar.
- **CA-2** A mesma senha chega por e-mail (Resend) pra parceira.
- **CA-3** Na `/login`, toggle "Entrar com senha" → e-mail + senha provisória → entra.
- **CA-4** Logo após entrar com a provisória, é redirecionada pra `/trocar-senha` (não consegue usar `/dashboard` antes de trocar).
- **CA-5** Após trocar, vai pro `/dashboard`; a senha provisória não funciona mais; a nova funciona.
- **CA-6** Login com senha respeita o gate: e-mail sem `subscription_status='paid'` é barrado igual ao OTP.
- **CA-7** O login por **código (OTP)** continua funcionando exatamente como antes (não-regressão).
- **CA-8** Só admin gera senha provisória (`requireAdmin`); não-admin recebe erro.

## 6. Anti-SPEC / riscos

- Não altera o fluxo OTP (CA-7 garante não-regressão).
- Não cria coluna nem mexe em RLS (flag em `app_metadata`).
- **Trade-off conhecido:** senha provisória é forte mas de uso único; vira inválida na troca. Sem expiração temporal explícita (v1) — follow-up se necessário.
- **Auditoria:** geração loga em `console.info` com `memberId`. Sem tabela de auditoria nova (evita scope creep). Follow-up se o cliente pedir trilha formal.

## 7. Rollback

- Reverter os 4 arquivos editados + remover os 5 novos. Como não há migration, o rollback é só de código (`git revert` do PR). Senhas provisórias já geradas continuam válidas no Auth até troca — sem efeito colateral em schema.

## 8. Evidências (preencher na validação)

- [ ] Screenshot: botão gerar + senha revelada no admin.
- [ ] Screenshot/print: e-mail recebido com a senha.
- [ ] Screenshot: toggle senha na /login + redirect pra /trocar-senha.
- [ ] Log Supabase Auth: `app_metadata.must_reset_password` true→false.
- [ ] OTP ainda funciona (CA-7).
