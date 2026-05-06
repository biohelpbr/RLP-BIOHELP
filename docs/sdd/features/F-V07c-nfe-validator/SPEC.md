# F-V07c — Validação automática de NF (PDF/XML)

## Metadata
- ID: F-V07c (sub-feature de F-V07)
- Classe: C (validação de input + acoplamento ao server action existente)
- Status: Draft → S5
- Onda: 7 (S5)
- Data: 2026-05-06

## Contexto
PIVOT-V2 TBD-4 ✅: NF é validada **automaticamente** no upload — formato, dados básicos. Se inválida, sistema dá erro imediato pro usuário (não vai pra fila do admin). F-V07 S2 deixou apenas filename anexado; agora em S5 a função `validateInvoice(buffer, mimeType)` precisa rodar antes do insert em `payout_requests`.

**Escopo realista S5:** Validação por **assinatura textual** (sem OCR pesado nem parser XML completo de NFe). Cobre 90% dos casos:
- PDF: extrai texto plano via lib pdf-parse (já presente no projeto? checar; senão fallback a busca por bytes ASCII).
- XML: parse simples DOM (DOMParser ou regex pra tags fundamentais).

**Não-objetivo:** validação fiscal completa (validação SEFAZ, autenticidade, certificado digital).

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Dados Biohelp para assinatura (CNPJ + razão social) — placeholder em env (TBD-27 confirma com cliente).

## Requisitos Funcionais
- **RF-1:** `lib/payouts/v2/nfe-validator.ts` exporta `validateInvoice(buffer: Uint8Array | string, mimeOrFilename: string): ValidationResult`.
- **RF-2:** `ValidationResult = { valid: boolean; reason?: string; metadata?: Record<string, any> }`.
- **RF-3:** Detecta formato:
  - `application/pdf` ou nome com `.pdf` → tratar como PDF.
  - `text/xml`, `application/xml` ou `.xml` → tratar como XML.
  - Outro → `{valid:false, reason:"Formato não suportado (PDF/XML apenas)"}`.
- **RF-4:** **PDF**: extrai texto plano (pdf-parse ou fallback regex em buffer). Verifica que contenha:
  - CNPJ Biohelp configurado em env `BIOHELP_CNPJ` (default `12.345.678/0001-90` placeholder S2).
  - Palavra `Biohelp` ou razão social parcial.
  - Se algum falta → invalid.
- **RF-5:** **XML**: parse leve. Procura tag `<emit><CNPJ>` ou `<dest><CNPJ>` contendo o CNPJ Biohelp normalizado (sem pontuação). Se não acha → invalid.
- **RF-6:** Função pura — não toca DB, não chama serviços externos.
- **RF-7:** Acoplada em `lib/payouts/v2/actions.ts` `requestPayout`: quando `payout_method='pix'` e há `invoice_buffer`, validar antes do insert. Inválido → retorna `{ok:false, error: validation.reason, field:"invoice_filename"}`.

## Critérios de Aceite
- **CA-01:** PDF válido (texto contém CNPJ + "Biohelp") → `valid:true`.
- **CA-02:** PDF sem CNPJ → `valid:false, reason="CNPJ da Biohelp não encontrado…"`.
- **CA-03:** PDF sem "Biohelp" → `valid:false`.
- **CA-04:** XML com `<emit><CNPJ>12345678000190</CNPJ></emit>` → `valid:true`.
- **CA-05:** XML sem CNPJ → `valid:false`.
- **CA-06:** Arquivo .docx → `valid:false, reason="Formato não suportado…"`.
- **CA-07:** `requestPayout` com NF inválida → action retorna `ok:false` + nada inserido em `payout_requests`.

## Arquivos PERMITIDOS
- `lib/payouts/v2/nfe-validator.ts` (novo)
- `lib/payouts/v2/actions.ts` (refator pra acoplar validator + receber buffer/base64)
- `lib/payouts/v2/schema.ts` (extender com `invoice_data_url` opcional pra Pix)
- `components/biohelp/WithdrawDialog.tsx` (read file → base64 → pass to action)

## Arquivos PROIBIDOS (Anti-SPEC)
- `lib/cv/*`, `lib/commissions/*`
- Webhooks v1
- Adicionar deps pesadas (pdf.js bundle full): preferir extração simples.

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | PDF mock com text contendo CNPJ + "Biohelp" → valid | unit | TODO | … |
| CA-02 | PDF mock sem CNPJ → invalid | unit | TODO | … |
| CA-03 | PDF mock sem "Biohelp" → invalid | unit | TODO | … |
| CA-04 | XML mock com emit/CNPJ → valid | unit | TODO | … |
| CA-05 | XML mock sem CNPJ → invalid | unit | TODO | … |
| CA-06 | docx → invalid | unit | TODO | … |
| CA-07 | requestPayout aceita buffer válido / rejeita inválido | integration | TODO | … |

## Rollback
- Revert do PR.
- Action mantém schema antigo (filename only) → comporta-se como S2.
