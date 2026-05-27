# Upgrade Supabase Free → Pro (passo-a-passo)

## Por que fazer upgrade?

| Limitação Free | Pro |
|---|---|
| **2 emails/hora** (magic link) | **100 emails/hora** (com SMTP custom: ilimitado) |
| 500 MB database | 8 GB database |
| 1 GB bandwidth | 250 GB bandwidth |
| Sem backups diários | Backups diários 7 dias |
| Sem custom SMTP | Custom SMTP (email vem de @bio-help.com) |

**Custo:** $25/mês por projeto

## Passo-a-passo

### 1. Acessar o Supabase Dashboard
- Abre: https://supabase.com/dashboard/project/ikvwzfbkbwpiewhkumrj
- Loga com a conta que criou o projeto

### 2. Ir em Billing
- Menu lateral → clica no nome do projeto (topo)
- Clica em **"Organization"** ou **"Billing"**
- OU acessa direto: https://supabase.com/dashboard/org/_/billing

### 3. Upgrade para Pro
- Na seção "Current Plan" vai mostrar **"Free"**
- Clica em **"Upgrade to Pro"**
- Preenche dados de pagamento (cartão de crédito)
- Confirma

### 4. Após upgrade — Configurar SMTP customizado (opcional mas recomendado)

Com Pro, você pode configurar SMTP próprio pra:
- Emails saírem de `noreply@bio-help.com` (em vez de "Supabase Auth")
- Rate limit subir pra 100+ emails/hora
- Customizar template dos emails (logo Biohelp, texto em português)

**Opção gratuita: Resend.com**
1. Cria conta em https://resend.com (grátis até 3000 emails/mês)
2. Adiciona domínio `bio-help.com` (verificação DNS)
3. Pega as credenciais SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Pass: `re_XXXXXX` (API key)
4. No Supabase Dashboard → Settings → Authentication → SMTP Settings:
   - Sender email: `noreply@bio-help.com`
   - Sender name: `Biohelp Nutrition Club`
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `re_XXXXXX`
5. Salva

### 5. Após SMTP — Aumentar rate limit
No Supabase Dashboard → Settings → Authentication → Rate Limits:
- Email rate limit: `100` (era 2)
- OTP rate limit: `60`
- SMTP max frequency: `10` segundos

### 6. Customizar template do email (opcional)
No Supabase Dashboard → Settings → Authentication → Email Templates:
- Magic Link: trocar "Your Magic Link" por "Seu acesso ao Biohelp"
- Trocar o HTML pra ter logo Biohelp + texto em português

---

## Resumo rápido

| Passo | Tempo | O que faz |
|---|---|---|
| Upgrade Pro | 2 min | $25/mês, resolve limite de DB/bandwidth |
| SMTP Resend | 10 min | Emails vêm de @bio-help.com, sem limite 2/hora |
| Rate limits | 1 min | Aumenta pra 100 emails/hora |
| Template email | 5 min | Email em português com logo Biohelp |
