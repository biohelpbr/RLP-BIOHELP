# SPEC.md — Biohelp Loyalty Reward Program (LRP)
**Spec-Driven Development (SDD) / Documento Mestre do Projeto**  
**Stack:** Next.js (App Router) + Supabase (Postgres/Auth/RLS) + Shopify (Admin API + Webhooks)  
**Versão:** v1.0 (SDD)  
**Status:** Base para execução (contrato/escopo)  
**Owner:** Biohelp  
**Implementador:** (Seu time)  

> **Regra de ouro do SDD:** qualquer mudança relevante neste SPEC.md (regras, fluxos, campos, endpoints, critérios de aceite) **é mudança de escopo** e deve passar por aprovação do cliente antes de implementar.

---

## 0) Objetivo do produto
Criar um programa de fidelidade/relacionamento que permita:
1) **Cadastro de membros** com indicação (link/ref) e sem link (regra definida),  
2) **Vínculo de rede** (sponsor/indicação),  
3) **Sincronização com Shopify** (criar/atualizar customer + tags/metacampos) para habilitar a experiência de “membro” na loja,  
4) Em fases posteriores: **CV mensal**, **status ativo/inativo**, **níveis**, **comissões** e **saques**.

---

## 1) Escopo por fases (controle do projeto)
### 1.1 Sprint 1 (MVP Operacional Inicial)
**Entrega:** “Cadastre, vire membro, convide, compre como membro.”  
Inclui:
- Cadastro com link (`ref` + UTM)
- Regra de cadastro sem link (TBD assinado)
- Geração de `ref_code` e link de convite
- Auth (Supabase)
- Dashboard do membro v1 (mínimo)
- Admin mínimo (listar/buscar membro, ver sponsor, resync Shopify)
- Sync Shopify Customer (create/update + tags mínimas)
- Redirect pós-cadastro para fluxo Shopify (login/conta)

**Não inclui:** CV, níveis, comissões, saques, árvore avançada, BI.

### 1.2 Sprint 2 (CV + status)
- Webhooks Shopify (paid/refund/cancel)
- Cálculo de CV por item/pedido
- CV mensal + status (>= 200 CV/mês)

### 1.3 Sprint 3 (Rede visual + níveis)
- Visualização da rede (simples)
- Cálculo de níveis (Parceira/Líder/Diretora/Head) conforme regras aprovadas

### 1.4 Sprint 4 (Comissões + ledger)
- Ledger auditável e motor de comissões faseado

### 1.5 Sprint 5 (Saques + fiscal)
- Saques, documentos, regras PF/PJ, integrações (se definidas)

---

## 2) Perfis de usuário e permissões
### 2.1 Member (Membro)
- Pode: cadastrar-se, logar, ver seu link/ref, ver sponsor, ver status (quando existir), ver CV/nível/comissões (quando existirem), solicitar saque (fase futura).
- Não pode: ver dados de outros membros fora de sua rede permitida; não pode alterar rede; não pode acessar admin.

### 2.2 Admin (Operação Biohelp)
- Pode: listar/buscar membros, ver sponsor e ref_code, reprocessar sync Shopify, ver logs básicos, (fases futuras) ajustar status, revisar saques.
- Não pode (Sprint 1): “mover rede” ou fazer ações manuais destrutivas sem trilha de auditoria.

---

## 3) Conceitos e definições
### 3.1 Rede (Referral Tree)
- Cada membro tem **0 ou 1 sponsor** (quem indicou).
- Um sponsor pode ter vários indicados (N1).
- Profundidade: N2, N3... (fases futuras, conforme regras).

### 3.2 ref_code
- Código único do membro usado no link de indicação.
- Deve ser **imutável** após criado.

### 3.3 CV (Commission Volume) — fase futura
- Pontuação associada aos produtos/pedidos.
- Medida mensal: soma do mês corrente.
- Regra principal: **Ativa se CV >= 200 no mês**.

### 3.4 Status (Ativa/Inativa) — fase futura
- Atualizado mensalmente via job de fechamento.
- Refunds e cancelamentos podem impactar CV/status conforme regra assinada.

---

## 4) Regras de negócio (Sprint 1)
### 4.1 Cadastro com link (ref)
**Entrada:** `ref=<ref_code>` (obrigatório para “cadastro com link”) + UTM opcionais.  
**Regra:**
- Se `ref` existe e está válido → sponsor = membro dono do ref_code.
- Se `ref` inválido → tratar como **cadastro sem link** (seguir regra TBD) e registrar evento.

### 4.2 Cadastro sem link (TBD obrigatório)
Definir UMA regra (precisa estar assinada no Anexo TBD):
- **A)** Sponsor = “House Account” (um usuário raiz do sistema)  
- **B)** Distribuição para uma lista de líderes elegíveis  
- **C)** Sem sponsor (rede começa nele) *(não recomendado se gerar exceções)*

> Implementar apenas após decisão assinada. Sem decisão, o comportamento padrão é bloquear com mensagem “cadastro indisponível sem convite”.

### 4.3 Unicidade de membro
- Um e-mail só pode ter 1 membro.
- Se tentar cadastrar com e-mail existente: direcionar para login.

### 4.4 Shopify sync (customer + tags) — Sprint 1
- Ao cadastrar (ou re-sincronizar), garantir:
  - Customer existe (create/update)
  - Tags mínimas aplicadas
  - (Opcional) Metacampos mínimos

**Tags recomendadas (ajustável por decisão do cliente):**
- `lrp_member`
- `lrp_ref:<ref_code>`
- `lrp_sponsor:<sponsor_ref_code|none>`
- `lrp_status:pending|active|inactive` *(pending no Sprint 1)*

### 4.5 Redirect pós-cadastro
- Após finalizar cadastro e sync Shopify, direcionar usuário para:
  - Página de login/conta da Shopify (conforme URL definida pelo cliente)

---

## 5) Fluxos do usuário (Sprint 1)
### 5.1 Fluxo: cadastro com link
1) Usuário abre link: `/join?ref=XXXX&utm_source=...`
2) Preenche nome + e-mail + senha
3) Sistema cria member e vincula sponsor
4) Sistema cria/atualiza customer Shopify e aplica tags
5) Sistema loga usuário (Supabase Auth) e leva para `/dashboard`
6) Dashboard mostra link de convite e instruções para compra
7) CTA: “Ir para a loja” (redirect para Shopify)

**Critério de aceite:**
- Sponsor correto salvo
- Customer Shopify criado/atualizado com tags
- Link de convite aparece e funciona

### 5.2 Fluxo: login
1) Usuário acessa `/login`
2) Autentica via Supabase
3) Vai para `/dashboard`

### 5.3 Fluxo: admin busca membro
1) Admin acessa `/admin`
2) Busca por e-mail
3) Vê sponsor/ref_code
4) Clica “Resync Shopify”

---

## 6) Rotas e páginas (Next.js App Router)
### 6.1 Públicas
- `GET /` (landing simples ou redirect)
- `GET /join` (cadastro)
- `GET /login` (login)

### 6.2 Autenticadas (member)
- `GET /dashboard`

### 6.3 Autenticadas (admin)
- `GET /admin`
- `GET /admin/members/[id]` (detalhe do membro)

---

## 7) API interna (Next.js) — endpoints propostos
> Preferir Server Actions quando possível, mas Webhooks exigem API routes/handlers.

### 7.1 POST `/api/members/join`
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "ref": "string | null",
  "utm": { "source": "string?", "medium": "string?", "campaign": "string?", "content": "string?", "term": "string?" }
}
```
**Regras:**
- valida e-mail único
- resolve sponsor_id via ref (ou regra sem link)
- cria member + referral_event
- cria/atualiza customer na Shopify e aplica tags
- retorna `{ "ok": true, "redirect": "/dashboard" }`

**Erros:**
- `409 EMAIL_EXISTS`
- `400 INVALID_REF` (se optar por bloquear sem link)
- `500 SHOPIFY_SYNC_FAILED` (com retry manual via admin)

### 7.2 POST `/api/admin/members/:id/resync-shopify`
- Reaplica tags/metacampos e revalida customer

### 7.3 (Fase futura) POST `/api/webhooks/shopify/orders-paid`
- Handler de webhooks com idempotência

---

## 8) Integração Shopify (mínimo viável)
### 8.1 Credenciais e segurança
- Usar Admin API token em variáveis de ambiente no backend.
- Nunca expor token no client.

### 8.2 Operações (Sprint 1)
- Customer: create/update por e-mail
- Tags: aplicar padrão definido neste SPEC

### 8.3 (Fase futura) Webhooks
- Assinar webhooks para eventos de pedido e reembolso
- Implementar idempotência e logs

---

## 9) Banco de dados (Supabase/Postgres) — schema proposto (Sprint 1)
> Objetivo: suportar cadastro, rede e sync Shopify com RLS segura.

### 9.1 Tabela `members`
- `id` uuid (pk)
- `name` text
- `email` text unique
- `ref_code` text unique (imutável)
- `sponsor_id` uuid nullable (fk -> members.id)
- `status` text default 'pending' *(fase futura: active/inactive)*
- `created_at` timestamptz default now()

### 9.2 Tabela `referral_events`
- `id` uuid pk
- `member_id` uuid fk
- `ref_code_used` text nullable
- `utm_json` jsonb nullable
- `created_at` timestamptz default now()

### 9.3 Tabela `shopify_customers`
- `id` uuid pk
- `member_id` uuid unique fk
- `shopify_customer_id` text
- `last_sync_at` timestamptz
- `last_sync_status` text ('ok'|'failed')
- `last_sync_error` text nullable

### 9.4 Tabela `roles`
- `id` uuid pk
- `member_id` uuid unique fk
- `role` text ('member'|'admin')

### 9.5 (Fases futuras)
- `orders` (espelho do Shopify)
- `cv_ledger`
- `commission_ledger`
- `payout_requests`

---

## 10) Políticas RLS (Supabase) — regras mínimas (Sprint 1)
### 10.1 members
- Member só pode ler seu próprio registro.
- Admin pode ler todos.

### 10.2 shopify_customers
- Member só pode ler seu próprio.
- Admin pode ler todos.

### 10.3 roles
- Apenas admin pode ler/alterar.

> Implementação: via JWT claims do Supabase + checagem role no backend quando necessário.

---

## 11) Requisitos técnicos
- Next.js App Router (TypeScript)
- Supabase Auth (email/password)
- Supabase RLS habilitado desde o início
- Logs estruturados no backend (info/warn/error)
- Variáveis de ambiente separadas (staging/prod)
- Feature flags para fases futuras (`ENABLE_WEBHOOKS`, etc.)
- Deploy staging na Vercel

---

## 12) Casos de erro e comportamento esperado
- **ref inválido:** seguir regra definida (bloquear ou tratar sem link) e registrar evento
- **Shopify indisponível:** criar member mesmo assim, marcar sync failed e permitir reprocesso no admin
- **E-mail já existe:** retornar 409 e sugerir login
- **Admin resync:** se falhar, registrar erro e manter estado anterior

---

## 13) Proibições e limitações (para evitar escopo infinito)
- Não implementar “mover rede” no admin no MVP
- Não implementar BI avançado no MVP
- Não implementar UI sofisticada de árvore no MVP
- Não implementar comissões/saques sem ledger auditável
- Qualquer regra fiscal (RPA/NF-e) só entra na Fase 5

---

## 14) Checklist de validação (por sprint)
### 14.1 Sprint 1 — Aceite
- [ ] Cadastro com link vincula sponsor corretamente
- [ ] ref_code único gerado e imutável
- [ ] Customer Shopify criado/atualizado
- [ ] Tags aplicadas corretamente
- [ ] Dashboard mostra link de convite e sponsor
- [ ] Admin busca membro e executa resync Shopify
- [ ] RLS ativo (member não lê dados de outro member)

### 14.2 Sprint 2 — Aceite (futuro)
- [ ] Webhooks idempotentes
- [ ] CV soma corretamente por pedido
- [ ] Refund desfaz CV
- [ ] Status mensal correto

---

# Como usar este SPEC no Cursor (SDD na prática)

## A) Estrutura recomendada no repositório
Crie a pasta:
- `docs/SPEC.md` (este arquivo)
- `docs/DECISOES_TBD.md` (somente itens pendentes e assináveis)
- `docs/CHANGELOG.md` (toda mudança aprovada)
- `docs/ACCEPTANCE.md` (checklists por sprint)

## B) Regra de trabalho no Cursor (obrigatória)
1) **Antes de qualquer mudança**, o agente/dev deve ler `docs/SPEC.md`.
2) Toda tarefa deve apontar para:
   - seção do SPEC (ex.: “Implementar 7.1 /api/members/join”)
   - critérios de aceite (seção 14)
3) Se algo não estiver no SPEC, a resposta padrão é:
   - “Isso não está no escopo do sprint; registrar como TBD/mudança de escopo.”

## C) Prompts prontos para usar no Cursor (copiar e colar)
### C.1 Implementação orientada por SPEC (Sprint 1)
> Leia `docs/SPEC.md` por completo. Em seguida implemente apenas o Sprint 1, seguindo as seções 4, 5, 6, 7, 8, 9, 10 e 14.  
> Respeite RLS. Não adicione funcionalidades fora do Sprint 1.  
> Gere os arquivos necessários, e ao final liste quais critérios de aceite da seção 14 foram atendidos e como testar localmente.

### C.2 Revisão de PR por SPEC
> Revise este PR contra `docs/SPEC.md`.  
> Para cada mudança, diga: (a) qual seção do SPEC cobre isso, (b) se está no Sprint 1, (c) riscos/edge cases, (d) testes faltantes.  
> Se houver escopo extra, marque como “Mudança de Escopo”.

### C.3 Auditoria de banco e RLS
> Compare o schema e RLS do Supabase com a seção 9 e 10 do `docs/SPEC.md`.  
> Liste discrepâncias e gere o SQL de migração necessário (sem quebrar dados).

## D) Como conduzir o desenvolvimento (fluxo recomendado)
1) **Criar tarefas** (Checklist Sprint 1) com IDs internos: `S1-001`, `S1-002`...
2) Implementar uma por vez, com commits pequenos.
3) Ao finalizar, atualizar `docs/ACCEPTANCE.md` marcando checklist.
4) Ao mudar requisito, atualizar `docs/CHANGELOG.md` e (se necessário) `docs/SPEC.md` com aprovação do cliente.

## E) Como evitar “delírio” do agente
- Sempre iniciar prompt com: “Leia `docs/SPEC.md` e siga estritamente.”
- Sempre pedir para o agente apontar “qual seção” está implementando.
- Bloquear features fora do sprint e registrar em TBD.

---

## Apêndice — Itens TBD (exemplos)
> Devem ficar em `docs/DECISOES_TBD.md` e precisam de aprovação assinada.
- Regra de cadastro sem link (A/B/C)
- Como preço de membro é liberado na Shopify (mecanismo exato)
- Lista final de tags/metacampos
- Política de trava/saldo em análise (fase futura)
- Modelo exato de saques e fiscal (fase futura)
