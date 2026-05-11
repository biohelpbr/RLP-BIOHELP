# Runbook — Ativação V2 em Produção (11/06/2026)

> Procedimento operacional pra ativar a chave `LRP_V2=true` na produção do
> Biohelp LRP no dia da entrega final. **Reversível em ~1 minuto.**
>
> Owner: Eduardo Sousa (FlowCode). Stakeholders Biohelp: Léo, Gabi, Mateus.

**Data alvo:** 11/06/2026 (quinta) · janela ainda a confirmar com cliente
**Última atualização:** 11/05/2026 · após PR #7 (8 fixes pre-demo)

---

## 0. Pré-condições (checar 48h antes — 09/06)

| Item | Como verificar | Responsável | Status |
|---|---|---|---|
| Build verde no main | `npm run build` exit 0 | FlowCode | ⏳ |
| TypeScript zero erros | `npx tsc --noEmit` | FlowCode | ⏳ |
| Lint zero novos warnings | `npx next lint` | FlowCode | ⏳ |
| 10 migrations V2 aplicadas em prod | `mcp__supabase__list_migrations` | FlowCode | ✅ (06/05) |
| Validação manual do cliente (10/06) | Demo + checklist | Biohelp + FlowCode | ⏳ |
| Decisões P0 resolvidas (TBD-1, TBD-2, TBD-20) | Mensagem cliente | Biohelp | ⏳ |
| Credenciais Cashin (sandbox + prod) | Env vars setadas | Biohelp/Léo | ⏳ |
| Dados reais NF Biohelp (TBD-27) | WithdrawDialog.tsx | Biohelp/Gabi | ⏳ |
| URL definitiva loja Shopify | `NEXT_PUBLIC_SHOPIFY_STORE_URL` | Biohelp | ⏳ |
| Plano Shopify confirmado (Plus ou Standard) | Mateus | Biohelp | ⏳ |
| Janela operacional combinada | WhatsApp/email | Todos | ⏳ |

**Se algum item P0 estiver vermelho 24h antes (10/06):** adiar go-live em
1 semana. Não forçar.

---

## 1. Decisão pendente: saldo `commission_ledger` v1 herda ou zera?

Em prod, **13 membros** têm comissão histórica v1 (`commission_ledger`) que
**aparece como saldo disponível** no painel V2 (`getMemberBalance` lê do RPC
`get_available_balance` que agrega v1).

**Opções:**

- **A — Herda (default atual):** membros vêem saldo histórico no V2 e podem
  resgatar via triple resgate. Risco: comissão calculada via regras v1
  (Fast-Track, Perpétua) mistura com regras v2 (50% direto). Cliente decide.
- **B — Zera no go-live:** rodar SQL antes da ativação. Membros começam V2
  com saldo zero. Cleaner mas perde "dinheiro acumulado".
- **C — Híbrido:** congela saldo v1 (status final `paid_legacy`), mostra como
  histórico-só-leitura no V2 painel; novo saldo conta só do que F-V04 (v2)
  calcular daqui pra frente.

**SQL pra Opção B (zerar):**
```sql
-- Backup primeiro
CREATE TABLE commission_ledger_backup_pre_v2 AS SELECT * FROM commission_ledger;

-- Zera o que está available pra resgate
UPDATE commission_ledger
SET status = 'archived', archived_at = now(), archived_reason = 'v2-cutover'
WHERE status IN ('pending', 'released');
```

**Aguardando decisão do cliente** (item 7 do WhatsApp enviado 11/05).

---

## 2. Procedimento de ativação (T-0)

### T-15min — Comunicação prévia
- Mandar mensagem no grupo Biohelp: "Iniciando ativação V2 em 15 minutos."
- Confirmar que admin Biohelp está disponível pra validação rápida.
- Pausar marketing/eventos que façam novos cadastros nas próximas 2h.

### T-5min — Backup
```bash
# Snapshot do Supabase via Dashboard ou CLI
# (Dashboard: Project Settings → Database → Backups → Create manual backup)

# Tag do código atual em main
cd c:/Users/edusp/Projetos_App_Desktop/RLP-bio_help
git tag -a v2-cutover-2026-06-11 -m "Snapshot antes de ativar LRP_V2 em prod"
git push origin v2-cutover-2026-06-11
```

### T-2min — Validação final
```bash
# Confirma que migrations v2 estão aplicadas (deve listar 10):
gh api repos/biohelpbr/RLP-BIOHELP/contents/supabase/migrations | jq '.[] | select(.name | contains("f-v") or contains("f_v"))'

# Confirma que main está no estado esperado (último commit do dia 09/06)
git log origin/main --oneline | head -5
```

### T-0 — Flip the switch
**Via Vercel Dashboard:**
1. Projeto rlp-biohelp → Settings → Environment Variables.
2. Encontre `LRP_V2=false`.
3. Edit → mude pra `true`.
4. **Save** → Vercel re-deploy automático (≈2-3 min).

**Via Vercel CLI (alternativa):**
```bash
npx vercel env rm LRP_V2 production
echo "true" | npx vercel env add LRP_V2 production
npx vercel --prod
```

### T+3min — Smoke checks (produção)
```bash
# 1. Login renderiza V2 (tabs Parceira/Admin):
curl -s https://rlp-biohelp.vercel.app/login | grep -c "Sou Parceira"
# Esperado: 1+

# 2. /join renderiza V2 (campo "Código de quem te convidou"):
curl -s https://rlp-biohelp.vercel.app/join | grep -c "Código de quem te convidou"
# Esperado: 1+

# 3. Webhook orders/paid continua respondendo 401 sem HMAC válido:
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://rlp-biohelp.vercel.app/api/webhooks/shopify/orders/paid
# Esperado: 401
```

### T+10min — Validação humana
Membro real (Léo ou Gabi) faz:
1. Login com conta existente → vê V2Dashboard (com cards + sidebar Biohelp).
2. Click "Copiar link" → confirma que copia URL com `?ref=`.
3. Abre `/dashboard/finance` → vê saldo + dialog de resgate (3 abas).
4. Logout → cai em `/login`.

Admin faz:
1. Login admin → `/admin` → vê V2 Overview.
2. Vai pra `/admin/payouts` → vê resgates pendentes com botões Aprovar/Rejeitar.
3. Aprovação test funciona (em payout de teste).

---

## 3. Rollback (se algo der errado)

**Tempo médio: 1 minuto.**

**Via Vercel Dashboard:**
1. Project → Settings → Environment Variables.
2. `LRP_V2` → edit → `false`.
3. Save → re-deploy (≈2 min).

**Via CLI:**
```bash
npx vercel env rm LRP_V2 production
echo "false" | npx vercel env add LRP_V2 production
npx vercel --prod
```

**Após rollback:**
1. Confirme com curl que `/login` voltou pro design antigo (sem tabs).
2. Mensagem no grupo: "Rollback executado. V1 ativo. Investigando."
3. Abrir issue no GitHub com logs de erro do Vercel Dashboard.

**O que NÃO precisa rollback:**
- Migrations v2 já aplicadas (idempotentes, não atrapalham v1).
- Dados criados durante a janela V2 ON (member_leads, member_sales,
  payout_requests com `payout_method` v2) — ficam quiescentes no DB sem
  serem lidos pelo v1.

---

## 4. Pós-ativação (primeiras 48h)

### Monitoramento ativo (T+0 a T+24h)
- **Vercel Logs**: aba Functions, filtrar por `error` ou `[webhook]`.
- **Supabase Dashboard → Logs**: filtrar por queries com erro.
- **Auth audit**: `SELECT * FROM auth_audit ORDER BY created_at DESC LIMIT 50;`
- **Cron auto-tags F-V18** (próximas 03:00 UTC): conferir `updated: > 0`
  via curl com Bearer secret.

### Métricas a olhar
| Métrica | Como medir | Alerta se |
|---|---|---|
| Login success rate | Logs Vercel `/api/auth/login` 200 vs 4xx | > 5% de 4xx |
| Webhook orders/paid | Vercel function logs | qualquer 5xx |
| Server Action errors | Console.error nos logs | > 0 |
| Tags auto aplicadas | SQL view `member_active_affiliate_count` | 0 atualizações depois F-V03 popular |
| Payouts pendentes acumulando | `SELECT count(*) FROM payout_requests WHERE status='pending'` | > 10 sem ação admin |

### Pós-48h: ativar cron F-V18 em modo definitivo
```bash
# Confirma que vercel.json tem entry:
grep "auto-tags" vercel.json
# Esperado: linha com path /api/cron/auto-tags e schedule "0 3 * * *"
```

---

## 5. Limpeza V1 (Onda 6 — pós-junho/2026)

**Não fazer no go-live.** Aguardar V2 estável por **4 semanas** em prod
(11/06 → 09/07). Depois, F-V12 cleanup:

- Remover fisicamente `lib/cv/`, `lib/levels/`, `lib/commissions/` v1.
- Remover `app/dashboard/V1Dashboard.tsx`, `app/admin/V1Admin.tsx`, etc.
- Remover `app/dashboard/sales`, `network`, `commissions`, `payouts` v1.
- Migration cleanup: `DROP TABLE` cv_ledger, commission_ledger,
  fast_track_windows, etc. (após backup).
- Remover env var `LRP_V2` — V2 vira default.

Documentação completa em `docs/sdd/PIVOT-V2.md` §5 Onda 6.

---

## 6. Contatos de emergência

| Pessoa | Função | Disponibilidade |
|---|---|---|
| Eduardo Sousa | Dev principal FlowCode | 24h via WhatsApp |
| Léo (Biohelp) | Ownership produto | Horário comercial |
| Gabi (Biohelp) | Logística / fluxos | Horário comercial |
| Mateus Wink (parceiro) | Shopify/integrações | Sob demanda |

---

## 7. Checklist final pra dar OK na ativação

Antes de mudar `LRP_V2=false → true`, confirmar:

- [ ] Backup Supabase manual criado nas últimas 24h.
- [ ] Git tag `v2-cutover-2026-06-11` pushed.
- [ ] Decisões P0 (TBD-1, 2, 20) resolvidas.
- [ ] Credenciais Cashin sandbox **OU** decisão de iniciar com mock.
- [ ] Dados reais NF Biohelp commitados em prod env.
- [ ] URL loja Shopify definitiva commitada em prod env.
- [ ] Pessoa Biohelp disponível pra validação humana pós-flip.
- [ ] Janela operacional comunicada no grupo (avisar 2h antes).
- [ ] Decisão sobre saldo `commission_ledger` v1 (herda/zera/híbrido) executada.

Quando todos 9 itens verde → flip the switch.

---

*Última revisão: 11/05/2026.*
