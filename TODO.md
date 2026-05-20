# TODO.md — Biohelp LRP (Harness v3.2)

> Estado vivo. Toda feature B/C/D precisa de Feature Contract inline (ou SPEC dedicada em `docs/sdd/features/F-VNN-<slug>/SPEC.md`).
> **Fonte de progresso histórica:** `docs/STATUS_IMPLEMENTACAO.md` (snapshot por sprint).
> **Tabela de status das features v2:** `docs/sdd/PIVOT-V2.md` §2.

**Última atualização:** 2026-05-19.

---

## 1. Backlog priorizado (v2 — fonte: `docs/sdd/PIVOT-V2.md` §2)

| ID | Feature | Classe | Sprint | Status | Bloqueio |
|---|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | S2 | ⏳ Pendente | — |
| F-V02 | Integração Guru via webhook Shopify | D | S5 | ⏳ Pendente (precisa confirmar com Wink) | — |
| F-V03 | Status ativo = `subscription_paid` | C | S5 | ✅ Done (06/05) | — |
| F-V04 | Comissão 50% por assinatura de convidado | D | TBD | 🚫 Bloqueada | TBD-1, TBD-2 |
| F-V05 | Saldo + crédito Shopify 1:1 | C | S2 | ✅ UI Done; chamada `customer.credit` real pendente | — |
| F-V06 | Promoção a Founder ≥5 ativos | B | TBD | 🟡 Parcial | TBD-12 (hipótese padrão: definitivo) |
| F-V07 | Saque Founder Cashin + NF + triple resgate | D | S2/S5 | ✅ UI Done; Cashin live + NFe auto em S5 | — |
| F-V08 | Ranking de Founders | B | TBD | ✅ Destravada | — |
| F-V09 | Academy CMS | B | S4 | ✅ Done | — |
| F-V10 | Link WhatsApp Founder | A | TBD | 🚫 Bloqueada | TBD-16 |
| F-V11 | Visão restrita da rede | B | S1 | ✅ Done (29/04) | — |
| F-V12 | Cleanup v1 (CV, níveis, RPA) | D | Onda 6 | ⏳ Aguarda v2 estável | — |
| F-V13 | ~~Cupom creatina campanha~~ | — | — | ✅ Absorvida por F-V15 | — |
| F-V14 | Vendas manuais membro (CRM leve) | C | S2 | ✅ Done (06/05) | — |
| F-V15 | Eventos admin (criação + funil) | C | S4 | ✅ Done (06/05) | — |
| F-V16 | Painel admin completo (9 áreas) | B | S3-S4 | ✅ Done | — |
| F-V17 | SSO Shopify → Painel (App Proxy) | D | S5 | ✅ Done (06/05, default OFF) | — |
| F-V18 | Tags automáticas Líder/Influenciador | B | S3 | ✅ Done (06/05) | — |

**Próximas ações (snapshot 2026-05-19):**
- Roteiro de demo de 13/05 já apresentado ao cliente — `docs/sdd/features/decisoes-reuniao-fev2026/` registra retornos.
- Aguardando: respostas aos TBDs ainda abertos (1, 2, 8, 9, 12, 15, 16, 20, 21, 23-27).
- Próximo trabalho: pontos novos do cliente pós-demo (ver §2).

---

## 2. Em andamento

(vazio por enquanto — preencher ao iniciar próximas features pós-demo).

### Template de item

```
### F-VNN — <nome>
- **Classe:** A | B | C | D
- **SPEC:** `docs/sdd/features/F-VNN-<slug>/SPEC.md`
- **Status:** Em DoR | Em Implementação | Em QA | Em PR
- **Branch:** `feat/F-VNN-<slug>`
- **Próximo passo concreto:** ...
- **DoR (checklist):** ver SPEC §DoR
- **Feature Contract:** ver SPEC ou `docs/plans/feature-contracts/F-VNN.md` se >40 linhas
```

---

## 3. Backlog não priorizado / ideias

(vazio).

---

## 4. Pendentes técnicos (não-feature)

- Aplicar `LRP_V2=true` em produção quando todas as features S5 forem validadas pelo cliente.
- Onboarding Cashin live com Léo (TBD-19 ✅, mas credenciais sandbox/live ainda pendentes).
- Decidir prazo de validade do crédito Shopify (TBD-23).
- Dados reais de NF da Biohelp (CNPJ, razão social, endereço) — mover de hardcoded em `components/biohelp/WithdrawDialog.tsx` para env ou `system_config` (TBD-27).

---

## 5. Bugs

(vazio — usar `/triage-bugs` quando aparecer ≥2 bugs do cliente).

### Template de linha
| ID | Descrição | Repro | Classe | Domínio | Urgência | Impacto | Esforço | Modo | Status | Notas |
|---|---|---|---|---|---|---|---|---|---|---|
| BUG-NNN | ... | ... | A/B/C/D | auth/payouts/etc | P0/P1/P2 | crítico/médio | < 30min | fast-fix/standard | TRIADO/EM FIX/EM QA/RESOLVIDO | runbook? |

---

## 6. Decisões abertas / TBDs ao cliente

Fonte: `docs/sdd/PIVOT-V2.md` §4.1 (10 TBDs abertos).

Curtos prazos:
- TBD-23 (validade crédito Shopify), TBD-24 (eventos entry-fee?), TBD-25 (preço sugerido vendas manuais), TBD-26 (critério ranking Founder), TBD-27 (NF Biohelp dados).
- TBD-1/2 destravam F-V04 (comissão 50%) e parte de F-V07.
