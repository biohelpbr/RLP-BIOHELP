/**
 * F-V07c — Smoke test validateInvoice (lógica replicada inline pra rodar sem tsx).
 *
 * Uso: `node test-f-v07c-nfe-validator.mjs`
 */

const DEFAULT_BIOHELP_CNPJ = "12.345.678/0001-90"
const DEFAULT_BIOHELP_RAZAO = "Biohelp"

function normalizeCnpj(c) {
  return c.replace(/\D/g, "")
}
function detectFormat(m) {
  const x = m.toLowerCase()
  if (x.includes("pdf")) return "pdf"
  if (x.includes("xml")) return "xml"
  return "unsupported"
}
function bufferToString(input) {
  if (typeof input === "string") return input
  return Buffer.from(input).toString("latin1")
}
function hasDigitSequence(text, digits) {
  return text.replace(/\D/g, "").includes(digits)
}

function validateInvoice(buffer, mimeOrFilename) {
  const format = detectFormat(mimeOrFilename)
  if (format === "unsupported") {
    return { valid: false, reason: "Formato não suportado (PDF ou XML apenas)." }
  }
  const cnpjConfigured = process.env.BIOHELP_CNPJ || DEFAULT_BIOHELP_CNPJ
  const cnpjDigits = normalizeCnpj(cnpjConfigured)
  const razao = process.env.BIOHELP_RAZAO_SOCIAL || DEFAULT_BIOHELP_RAZAO

  if (cnpjDigits.length !== 14) {
    return { valid: false, reason: "CNPJ Biohelp inválido na configuração do servidor." }
  }
  const text = bufferToString(buffer)
  const textLower = text.toLowerCase()

  if (format === "pdf") {
    const containsCnpj =
      text.includes(cnpjConfigured) || text.includes(cnpjDigits) || hasDigitSequence(text, cnpjDigits)
    if (!containsCnpj) {
      return { valid: false, reason: "CNPJ da Biohelp não encontrado no PDF." }
    }
    if (!textLower.includes(razao.toLowerCase())) {
      return { valid: false, reason: `Razão social "${razao}" não encontrada no PDF.` }
    }
    return { valid: true }
  }

  const emitMatch = text.match(/<emit>[\s\S]*?<CNPJ>(\d{14})<\/CNPJ>/i)
  const destMatch = text.match(/<dest>[\s\S]*?<CNPJ>(\d{14})<\/CNPJ>/i)
  const anyCnpjMatch = text.match(/<CNPJ>(\d{14})<\/CNPJ>/i)
  const cnpjFound =
    emitMatch?.[1] === cnpjDigits ||
    destMatch?.[1] === cnpjDigits ||
    anyCnpjMatch?.[1] === cnpjDigits

  if (!cnpjFound) {
    return { valid: false, reason: "CNPJ da Biohelp não encontrado no XML." }
  }
  return { valid: true }
}

process.env.BIOHELP_CNPJ = "12.345.678/0001-90"
process.env.BIOHELP_RAZAO_SOCIAL = "Biohelp"

let pass = 0, fail = 0
function check(name, result, valid, reasonIncludes = null) {
  const ok =
    result.valid === valid &&
    (reasonIncludes === null ||
      (result.reason ?? "").toLowerCase().includes(reasonIncludes.toLowerCase()))
  if (ok) { pass++; console.log(`  PASS ${name}`) }
  else { fail++; console.log(`  FAIL ${name} → ${JSON.stringify(result)}`) }
}

console.log("F-V07c validateInvoice:")
check("CA-01 PDF cnpj+biohelp", validateInvoice("Razao Social: Biohelp. CNPJ: 12.345.678/0001-90.", "invoice.pdf"), true)
check("CA-02 PDF sem CNPJ", validateInvoice("Razao Biohelp sem CNPJ.", "invoice.pdf"), false, "cnpj")
check("CA-03 PDF sem Biohelp", validateInvoice("CNPJ 12.345.678/0001-90 razao Outra LTDA.", "invoice.pdf"), false, "razão")
check("CA-04 XML emit", validateInvoice(`<NFe><emit><CNPJ>12345678000190</CNPJ></emit><dest><CNPJ>11111111000111</CNPJ></dest></NFe>`, "nfe.xml"), true)
check("CA-04b XML dest", validateInvoice(`<NFe><emit><CNPJ>99999999000199</CNPJ></emit><dest><CNPJ>12345678000190</CNPJ></dest></NFe>`, "nfe.xml"), true)
check("CA-05 XML sem CNPJ Biohelp", validateInvoice(`<NFe><emit><CNPJ>11111111000111</CNPJ></emit></NFe>`, "application/xml"), false, "cnpj")
check("CA-06 docx unsupported", validateInvoice("any", "invoice.docx"), false, "formato")
check("mime application/pdf", validateInvoice("CNPJ 12345678000190 Biohelp", "application/pdf"), true)
check("mime text/xml", validateInvoice(`<emit><CNPJ>12345678000190</CNPJ></emit>`, "text/xml"), true)

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
