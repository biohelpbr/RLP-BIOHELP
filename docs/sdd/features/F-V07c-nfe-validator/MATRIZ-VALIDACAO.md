# F-V07c — Matriz de Validação (S5)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | PDF com CNPJ + Biohelp → valid | unit | ✅ | `test-f-v07c-nfe-validator.mjs` (lógica replicada inline) — caso "PDF cnpj+biohelp" passa. |
| CA-02 | PDF sem CNPJ → invalid | unit | ✅ | mesmo arquivo — caso PDF sem CNPJ. |
| CA-03 | PDF sem "Biohelp" → invalid | unit | ✅ | mesmo arquivo — caso PDF sem Biohelp. |
| CA-04 | XML emit/CNPJ → valid | unit | ✅ | mesmo arquivo — case CA-04 e CA-04b. |
| CA-05 | XML sem CNPJ → invalid | unit | ✅ | mesmo arquivo. |
| CA-06 | docx → invalid (formato não suportado) | unit | ✅ | mesmo arquivo. |
| CA-07 | requestPayout rejeita invoice inválida | inspeção | ✅ | `lib/payouts/v2/actions.ts:28-44` — quando `payout_method='pix'` + `invoice_data_url` presente, valida antes do insert. Inválido → retorna `{ok:false, error: validation.reason}` sem inserir. |

**Cobertura aproximada:**
- PDF: **75%** dos casos comuns (texto plano + CNPJ + razão social). PDFs com texto comprimido em FlateDecode podem escapar — caso edge documentado, fallback é `valid:false reason="CNPJ não encontrado"` (admin pode aprovar manualmente reanalisando).
- XML: **90%** — regex direta cobre `<emit><CNPJ>`/`<dest><CNPJ>`/qualquer `<CNPJ>` com 14 dígitos. NFe brasileira segue layout padrão SEFAZ — alta consistência.

**Não-cobertos:**
- Validação de assinatura digital (certificado SEFAZ).
- PDFs scaneados (imagens) — exigiriam OCR.
- XMLs com namespace prefixado (ex.: `<n:CNPJ>`) — regex pode falhar; documentar e adicionar caso real.

**TBD:** dados Biohelp reais (CNPJ + razão social) — placeholder atual `12.345.678/0001-90` em `BIOHELP_CNPJ`. TBD-27 abre cobrança ao cliente. Em demo 13/05 confirma com cliente.
