# Prompts para sessão paralela — 22/05/2026

> Sessão principal está implementando F-V19 conforme `docs/sdd/PLANO-IMPLEMENTACAO-22MAI.md`.
> Esta sessão paralela roda em **arquivos disjuntos** (`docs/wiki/*` + estudo externo) — zero risco de conflito de merge.

---

## PROMPT A (RECOMENDADO) — Estudo API Guru + regen HTML + context pack F-V19

**Copiar e colar inteiro como primeira mensagem da nova sessão Claude Code CLI:**

```
Estou rodando 2 sessões em paralelo neste projeto (RLP-bio_help). A outra sessão está implementando F-V19 (fluxo pré-cadastro Guru → LRP → Shopify) conforme docs/sdd/PLANO-IMPLEMENTACAO-22MAI.md.

Sua tarefa é trabalhar em frentes ORTOGONAIS que não tocam código Next/lib/supabase — só docs + wiki + estudo externo. Você está PROIBIDO de editar qualquer arquivo fora de docs/. Se identificar necessidade, PARE e me peça aprovação.

Ordem das tarefas (faça nesta ordem, marcando TodoWrite):

==== TAREFA 1 (30 min) — Estudo da API do Guru ====

Contexto: cliente nos enviou credenciais para acessar o Guru (eduardo.sousa@flowcode.cc / senha "Flowcode"). NÃO LOGUE automaticamente — me peça aprovação se for usar WebFetch ou ferramenta de browsing autenticada. Em vez disso:

1. Use WebSearch para encontrar a documentação pública oficial do Guru (provavelmente https://docs.gurupay.com.br ou https://developers.gurupay.com.br). 
2. Use WebFetch para buscar:
   - Payload de webhook de "transaction.approved" / "subscription.created"
   - Payload de "subscription.renewed"
   - Payload de "subscription.cancelled" / "subscription.refunded"
   - Lista completa de event_types
   - Como o Guru assina HMAC (header name, algoritmo)
   - Como passar parâmetros customizados na URL do checkout (especialmente `external_id` ou equivalente — precisamos passar nosso `pre_registration_token` e recebê-lo de volta no webhook em `metadata.external_id`)
   - URL pattern do checkout: confirme se é https://pay.guru.com.br/<offer_id> ou outro formato

3. Crie/atualize docs/wiki/runbooks/webhook-guru-debug.md com:
   - Header HMAC (nome exato + algoritmo)
   - Schema Zod CORRIGIDO em bloco markdown — me dá pra eu aplicar manualmente em lib/subscriptions/providers/guru.ts depois (não edite esse arquivo agora — a outra sessão pode estar mexendo).
   - Lista oficial de event_types vs os 5 que assumi na SPEC (subscription.created, subscription.renewed, subscription.cancelled, subscription.refunded, transaction.approved).
   - Padrão de URL do checkout + parâmetros aceitos.
   - Como configurar webhook no painel Guru (passo a passo) — pra eu seguir após a call de 15h.
   - Erros conhecidos / quirks (ex.: webhook duplicado, latência, retries).

4. Se em algum ponto a doc oficial pública não cobrir, registre o gap no runbook como "🟡 PRECISA CONFIRMAR LOGANDO" e me reporta no fim — eu logo manualmente depois.

==== TAREFA 2 (20 min) — Context pack F-V19 + atualização do wiki vivo ====

5. Crie docs/wiki/context/F-V19.md seguindo o template do projeto (docs/wiki/index.md menciona o que esse arquivo deve ter). Conteúdo:
   - Estado atual: SPEC + plano criados, implementação MVP em andamento na outra sessão.
   - Arquivos relevantes: lista exatamente os 18 paths permitidos da SPEC.
   - Restrições da tarefa: Anti-SPEC §1,2,4,6 aplicáveis + flag LRP_V2_GURU_FLOW.
   - Próximos passos concretos pós-MVP demo (extraídos da §"Plano pós-demo" da SPEC).
   - Decisões abertas: items 1.6 (GURU_OFFER_ID) e 1.7 (Shopify variant id) do PERGUNTAS-CALL-20MAI.md.
   - Handoff: "última ação = SPEC e plano escritos; o que NÃO fiz e o próximo agente NÃO deve refazer = não comece a implementação do zero, siga PLANO-IMPLEMENTACAO-22MAI.md passo a passo".

6. Adicione uma linha em docs/wiki/log.md com timestamp 2026-05-22 no formato existente:
   `[2026-05-22] [SPEC] F-V19 criada — fluxo pré-cadastro Guru → LRP → Shopify; SPEC + plano em docs/sdd/; demo MVP 22/05 15h.`

==== TAREFA 3 (20 min) — Regerar HTML PENDENTES-POS-CALL-20MAI.html ====

7. Leia docs/sdd/PENDENTES-POS-CALL-20MAI.html (versão antiga, ~enviada ao Léo dia 20/05) e docs/sdd/PERGUNTAS-CALL-20MAI.md (versão atualizada hoje 22/05 — a fonte da verdade).
8. Regere o HTML preservando o CSS/estrutura visual existente (o cliente já está acostumado com o layout), mas com o conteúdo atualizado do .md de hoje, incluindo a seção "⚡ Atualização 22/05/2026" que adicionei no topo. 
9. Salve em docs/sdd/PENDENTES-POS-CALL-20MAI.html (sobrescrevendo).

==== TAREFA 4 (10 min) — Resumo de saída ====

10. Imprima na conversa um resumo curto (máx 200 palavras) com:
    - O que aprendi sobre a API Guru que diverge do que está na SPEC (se houver) → priorizar fix
    - Schema Zod final pra eu aplicar
    - Gaps marcados como "🟡 PRECISA CONFIRMAR LOGANDO"
    - Confirmação que context pack + wiki/log + HTML estão prontos

REGRAS:
- Você está PROIBIDO de editar arquivos fora de docs/. Se identificar bug crítico em lib/ ou app/, registre no wiki e me reporte — não corrija.
- Use TodoWrite com 4 itens (uma tarefa cada).
- Se WebFetch falhar em alguma URL específica, marque como gap no runbook e siga adiante — não trave.
- Não precisa testes formais, é trabalho de docs/research.
```

---

## PROMPT B (OPCIONAL — só se quiser uma frente extra de produto) — U4 Refator vendas manuais

> **⚠️ Risco médio:** mexe em código + migration. Coordenar timestamp da migration com a principal (use `20260522_u4_*` em vez de `20260522_f-v19_*` pra não colidir nome). Use BRANCH SEPARADA `feat/U4-vendas-manuais-refator` pra evitar conflito de merge.

```
Estou rodando 2 sessões em paralelo neste projeto. A outra sessão está implementando F-V19 na branch feat/F-V19-fluxo-guru-pre-cadastro. Sua sessão fica na branch nova feat/U4-vendas-manuais-refator (sair de main, não de feat/F-V19).

Tarefa: implementar U4 do docs/sdd/PERGUNTAS-CALL-20MAI.md §2.4 — refator "Minhas vendas → Novo registro" com:
- Membro digita custo livre por linha (não puxa do cadastro de produto do admin).
- Linhas múltiplas (produto / custo / receita / qty) com botão "+".
- Custo visível só pro próprio membro + admin (não pra outros membros da rede).

Antes de codar, leia (na ordem):
1. docs/wiki/index.md
2. AGENTS.md
3. docs/sdd/PIVOT-V2.md §3 (Anti-SPEC)
4. docs/sdd/features/F-V14-vendas-manuais-membro/SPEC.md (feature original que está sendo refatorada)
5. Schema atual: tabela `member_sales` (`SELECT * FROM member_sales LIMIT 3` via mcp__supabase__execute_sql ref ikvwzfbkbwpiewhkumrj).

Sua entrega:
1. SPEC F-V14b em docs/sdd/features/F-V14b-vendas-manuais-refator/SPEC.md (Feature Contract inline, classe C, decisão schema: jsonb vs tabela filha — escolha jsonb pra ser pragmático no MVP).
2. Migration `supabase/migrations/20260522_u4_vendas_manuais_lines.sql` (idempotente, rollback). Decida: ADD COLUMN lines jsonb DEFAULT '[]' no member_sales; manter colunas legadas (product, revenue, qty) por compatibilidade com leitura admin.
3. Atualize UI em app/dashboard/sales/* (modal NewSaleDialog ou similar) — tabela de linhas com botão +/-, totais ao vivo.
4. RLS: custo só visível ao próprio membro + admin (use is_admin() helper se existir, senão crie em lib/supabase/policies-helpers.sql).
5. Smoke local: criar 1 venda com 3 linhas, conferir totais calculados.

REGRAS:
- Você está PROIBIDO de editar:
  - app/api/webhooks/shopify/* (Anti-SPEC §4)
  - lib/subscriptions/* (a outra sessão está mexendo)
  - app/r/*, app/convite/*, app/welcome/*, app/api/webhooks/guru/*, app/api/dev/simulate-guru/*, app/api/cron/inactivate-expired-subscriptions/* (a outra sessão está criando)
  - lib/shopify/subscription-sync.ts, lib/notifications/*, components/notifications/* (a outra sessão está criando)
  - members table (apenas member_sales)
- Use TodoWrite.
- Faça commit no fim da sessão na branch feat/U4-vendas-manuais-refator. NÃO mergeie em feat/F-V19-fluxo-guru-pre-cadastro nem em main.
```

---

## Recomendação final

**Se você quer 1 sessão paralela:** abra **PROMPT A**. É a que mais acelera (estuda Guru real, prepara handoff pra próxima sessão, entrega HTML atualizado pro cliente).

**Se quer 2 sessões paralelas:** abra A primeiro, e B depois (só quando a principal estiver ≥ Passo 5 do plano — confirma que F-V19 não vai virar D≠C no meio e expandir escopo). Risco de conflito ainda existe se a principal precisar tocar `members` ou criar nova migration.

**Se você não tem certeza:** vá só de A.
