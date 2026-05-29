# F-V20 — CRM Absolut (outbound)

## Metadata
- **ID:** F-V20
- **Classe:** C (integração outbound com serviço externo do cliente; envia dados pessoais — nome/telefone/email — pra CRM de terceiro. NÃO toca webhook produção-crítico nem cria customer/order Shopify. Gated por env, sempre non-fatal.)
- **Status:** Draft
- **Onda:** 2 (Foundation v2) — apoia o fluxo de Live (F-V19), espelhando leads/clientes no CRM do parceiro.
- **Data:** 2026-05-28
- **Origem:** Contrato confirmado pelo cliente com Abner (responsável pelo CRM Absolut). Mensagem em `mensagem-abner-crm.txt`.

## Contexto

O cliente usa um CRM externo ("Absolut", operado pelo Abner) para acompanhar leads e clientes em campanhas outbound. Quando alguém entra na lista de espera (pré-cadastro F-V19) e quando a assinatura é confirmada (vira cliente), o LRP deve **espelhar** esse evento no CRM via webhook HTTP, usando uma etiqueta de evento.

Esta feature entrega **somente o módulo isolado** `lib/crm/absolut.ts`. O **wiring** nos pontos de disparo (`app/api/webhooks/guru/route.ts` e `lib/subscriptions/actions.ts`) é feito em **outra sessão** — não faz parte deste contrato.

### Contrato confirmado pelo cliente (Abner)
- **Campos:** `nome`, `telefone`, `email`, `codigo_indicacao`. **SEM CPF/CNPJ.**
- **Dois eventos via etiqueta:** `"lead_novo"` (entrou na lista de espera) e `"virou_cliente"` (assinatura confirmada).
- **Telefone DEVE sair em +55.** No repo gravamos só dígitos nacionais (~11 dígitos) → formatar no envio (ex.: `+55XXXXXXXXXXX`).
- **Token/senha:** AINDA não confirmado pelo Abner → suporte **opcional** via env (`CRM_ABSOLUT_TOKEN`). Quando ausente, nenhum header `Authorization` é enviado.

## Contrato de dados

```ts
// lib/crm/absolut.ts
interface SendToAbsolutInput {
  evento: "lead_novo" | "virou_cliente"
  nome: string
  email: string
  telefone: string              // dígitos nacionais (~11); formatado p/ +55 no envio
  codigoIndicacao: string | null // ref_code do sponsor, ou null
}

interface SendToAbsolutResult {
  ok: boolean
  skipped?: boolean             // true quando gate (CRM_ABSOLUT_LIVE) está off
  error?: string                // "missing_url" | "http_<status>" | "exception"
}

function sendToAbsolut(input: SendToAbsolutInput): Promise<SendToAbsolutResult>
function formatPhoneBR(raw: string): string
```

**Payload HTTP (POST JSON):**
```json
{
  "evento": "lead_novo",
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "telefone": "+5511987654321",
  "codigo_indicacao": "BH00042"
}
```

**Envs:**
| Env | Obrigatória | Função |
|---|---|---|
| `CRM_ABSOLUT_LIVE` | sim (gate) | só envia se `=== "true"`; caso contrário retorna `{ ok:true, skipped:true }` sem rede. Default off. |
| `CRM_ABSOLUT_WEBHOOK_URL` | quando live | URL do webhook do CRM. Ausente com live on → `{ ok:false, error:"missing_url" }` (non-fatal). |
| `CRM_ABSOLUT_TOKEN` | opcional | se existir, vai como `Authorization: Bearer <token>`. Ainda não confirmado pelo Abner. |

## Anti-SPEC aplicada
- **§4 (PIVOT-V2):** módulo **sempre non-fatal**. `try/catch` envolve tudo; nunca lança pro chamador. Falha no CRM JAMAIS pode derrubar webhook Guru / server action / resposta 200.
- **§11:** módulo isolado em `lib/crm/`, fácil de trocar de provider depois.
- Nenhum segredo hardcoded — só `process.env` no servidor.
- Não toca DB, não toca Shopify, não toca webhook Shopify (§2/§3/§4 PIVOT-V2 intocados).

## Definition of Ready
- [x] Contrato confirmado pelo cliente (campos + 2 eventos + telefone +55 + token opcional)
- [x] CAs testáveis (Matriz de Validação no fim)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] Classe confirmada (C)
- [x] Sem TBD bloqueante: token opcional resolve a pendência do Abner sem travar a entrega
- [x] Impacto em banco: nenhum
- [x] Impacto em produção: nenhum até wiring (outra sessão) + gate `CRM_ABSOLUT_LIVE` off por padrão

## Requisitos Funcionais

### RF-1 — `formatPhoneBR(raw)`
- Normaliza dígitos (`replace(/\D/g, "")`).
- Vazio → `""`.
- Se já tem DDI (≥12 dígitos começando com `55`) → prefixa só `+`, não duplica.
- Caso contrário (10-11 dígitos nacionais) → prefixa `+55`.
- Edge: número nacional com DDD 55 (Santa Maria/RS) tem 11 dígitos → não colide com a checagem de DDI (≥12).

### RF-2 — `sendToAbsolut(input)`
1. **Gate:** se `process.env.CRM_ABSOLUT_LIVE !== "true"` → retorna `{ ok:true, skipped:true }` SEM chamar rede.
2. **URL:** lê `CRM_ABSOLUT_WEBHOOK_URL`. Ausente → loga e retorna `{ ok:false, error:"missing_url" }` (non-fatal).
3. **Header:** `Content-Type: application/json` sempre. `Authorization: Bearer <token>` **só** se `CRM_ABSOLUT_TOKEN` existir.
4. **Body:** POST JSON `{ evento, nome, email, telefone: formatPhoneBR(telefone), codigo_indicacao }`.
5. **Resposta:** `res.ok` → `{ ok:true }`. Non-2xx → `{ ok:false, error:"http_<status>" }`.
6. **Erro:** qualquer exceção (rede, parse) → `try/catch` → `{ ok:false, error:"exception" }`. **Nunca lança.**

## Critérios de Aceite

| CA | Descrição |
|---|---|
| CA-01 | `CRM_ABSOLUT_LIVE` ausente OU `!= "true"` → `{ ok:true, skipped:true }` e `fetch` NÃO é chamado. |
| CA-02 | Flag on + `CRM_ABSOLUT_WEBHOOK_URL` ausente → `{ ok:false, error:"missing_url" }`, `fetch` NÃO chamado. |
| CA-03 | Flag on + URL + token → POST na URL com header `Authorization: Bearer <token>` + `Content-Type: application/json`. |
| CA-04 | Flag on + URL sem token → POST sem header `Authorization`. |
| CA-05 | Payload JSON = `{ evento, nome, email, telefone(+55), codigo_indicacao }`; `codigo_indicacao` null preservado. |
| CA-06 | `telefone` sai em `+55` (nacional 10/11 díg, com máscara, ou já com DDI — sem duplicar). |
| CA-07 | Resposta non-2xx (ex.: 500) → `{ ok:false, error:"http_500" }`. |
| CA-08 | `fetch` lança (rede) → `{ ok:false, error:"exception" }`, sem propagar erro (non-fatal). |

## Arquivos PERMITIDOS
- `docs/sdd/features/F-V20-crm-absolut/SPEC.md` (este — novo)
- `lib/crm/absolut.ts` (novo — módulo isolado)
- `test-crm-absolut.mjs` (novo — raiz)

## Arquivos PROIBIDOS (Anti-SPEC)
- `app/api/webhooks/guru/route.ts` — **NÃO fazer wiring** (outra sessão).
- `lib/subscriptions/actions.ts` — **NÃO fazer wiring** (outra sessão).
- `app/api/webhooks/shopify/orders/*` — Anti-SPEC §4.
- Qualquer migration / tabela — esta feature não toca DB.

## Matriz de Validação

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | `test-crm-absolut.mjs` "flag ausente/false → skipped sem rede" | unit | ✅ | fetch mock lança se chamado; retorno `{ ok:true, skipped:true }` |
| CA-02 | `test-crm-absolut.mjs` "flag on + sem URL → missing_url" | unit | ✅ | `{ ok:false, error:"missing_url" }`, fetch não chamado |
| CA-03 | `test-crm-absolut.mjs` "Authorization Bearer com token" | unit | ✅ | header capturado pelo fetch mock |
| CA-04 | `test-crm-absolut.mjs` "sem token → sem header Authorization" | unit | ✅ | header `Authorization === undefined` |
| CA-05 | `test-crm-absolut.mjs` "payload completo" | unit | ✅ | body parseado = contrato; `codigo_indicacao` null preservado |
| CA-06 | `test-crm-absolut.mjs` `formatPhoneBR` (7 casos) | unit | ✅ | nacional/máscara/DDI/DDD-55/vazio |
| CA-07 | `test-crm-absolut.mjs` "HTTP 500 → http_500" | unit | ✅ | `{ ok:false, error:"http_500" }` |
| CA-08 | `test-crm-absolut.mjs` "fetch lança → exception" | unit | ✅ | `{ ok:false, error:"exception" }` non-fatal |

Evidência adicional: `npx tsc --noEmit` verde (typecheck N1).

## Próximos passos (outra sessão — wiring)
1. Em `lib/subscriptions/actions.ts::createPreRegistration` → após criar member pending, chamar `sendToAbsolut({ evento:"lead_novo", ... })` (fire-and-forget, sem await bloqueante crítico).
2. Em `app/api/webhooks/guru/route.ts` (evento `subscription_activated`) → após `markSubscriptionPaid`, chamar `sendToAbsolut({ evento:"virou_cliente", ... })`.
3. Adicionar `CRM_ABSOLUT_LIVE`, `CRM_ABSOLUT_WEBHOOK_URL`, `CRM_ABSOLUT_TOKEN` em `.env.example`.
4. Confirmar token/URL com Abner; setar envs no Vercel; ligar `CRM_ABSOLUT_LIVE=true`.

## Referências
- Contrato Abner: `mensagem-abner-crm.txt`.
- Fluxo de pré-cadastro/cliente: `docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md`.
- Anti-SPEC §4 (non-fatal): `docs/sdd/PIVOT-V2.md` §3.
