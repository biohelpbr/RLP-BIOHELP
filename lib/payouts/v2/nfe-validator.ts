/**
 * F-V07c: validação automática de NF (PDF/XML).
 *
 * Função pura. Não toca DB, não chama serviços externos.
 *
 * Heurísticas:
 *   - PDF: extrai bytes ASCII em busca de CNPJ Biohelp + razão social.
 *     Não usa biblioteca pesada (pdf.js etc). PDFs com texto compresso
 *     (FlateDecode) podem escapar — caso edge documentado.
 *   - XML: regex sobre conteúdo, busca tags <emit><CNPJ> ou <dest><CNPJ>
 *     com CNPJ Biohelp normalizado (sem pontuação).
 *
 * Não-objetivo: validação fiscal (SEFAZ, certificado, autenticidade).
 */

export type ValidationResult = {
  valid: boolean
  reason?: string
  metadata?: Record<string, unknown>
}

const DEFAULT_BIOHELP_CNPJ = "12.345.678/0001-90"
const DEFAULT_BIOHELP_RAZAO = "Biohelp"

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "")
}

function getConfiguredCnpj(): string {
  return process.env.BIOHELP_CNPJ || DEFAULT_BIOHELP_CNPJ
}

function getConfiguredRazao(): string {
  return process.env.BIOHELP_RAZAO_SOCIAL || DEFAULT_BIOHELP_RAZAO
}

function detectFormat(
  mimeOrFilename: string
): "pdf" | "xml" | "unsupported" {
  const m = mimeOrFilename.toLowerCase()
  if (m.includes("pdf")) return "pdf"
  if (m.includes("xml")) return "xml"
  return "unsupported"
}

function bufferToString(input: Uint8Array | string): string {
  if (typeof input === "string") return input
  // Decode latin1 pra preservar bytes; PDFs têm streams binários, mas
  // metadados textuais (Title, /Producer, etc) ficam em ASCII.
  return Buffer.from(input).toString("latin1")
}

export function validateInvoice(
  buffer: Uint8Array | string,
  mimeOrFilename: string
): ValidationResult {
  const format = detectFormat(mimeOrFilename)
  if (format === "unsupported") {
    return {
      valid: false,
      reason: "Formato não suportado (PDF ou XML apenas).",
    }
  }

  const cnpjConfigured = getConfiguredCnpj()
  const cnpjDigits = normalizeCnpj(cnpjConfigured)
  const razao = getConfiguredRazao()

  if (cnpjDigits.length !== 14) {
    return {
      valid: false,
      reason: "CNPJ Biohelp inválido na configuração do servidor.",
    }
  }

  const text = bufferToString(buffer)
  const textLower = text.toLowerCase()

  if (format === "pdf") {
    const containsCnpj =
      text.includes(cnpjConfigured) ||
      text.includes(cnpjDigits) ||
      // CNPJ pode ter formatação diferente — busca por substring de 14 digitos contígua
      hasDigitSequence(text, cnpjDigits)
    if (!containsCnpj) {
      return {
        valid: false,
        reason: "CNPJ da Biohelp não encontrado no PDF.",
        metadata: { format, expectedCnpj: cnpjConfigured },
      }
    }

    const containsRazao = textLower.includes(razao.toLowerCase())
    if (!containsRazao) {
      return {
        valid: false,
        reason: `Razão social "${razao}" não encontrada no PDF.`,
        metadata: { format },
      }
    }

    return { valid: true, metadata: { format } }
  }

  // XML
  // Aceita CNPJ em qualquer tag, mas dá preferência para emit/CNPJ ou dest/CNPJ
  const emitMatch = text.match(/<emit>[\s\S]*?<CNPJ>(\d{14})<\/CNPJ>/i)
  const destMatch = text.match(/<dest>[\s\S]*?<CNPJ>(\d{14})<\/CNPJ>/i)
  const anyCnpjMatch = text.match(/<CNPJ>(\d{14})<\/CNPJ>/i)

  const cnpjFound =
    emitMatch?.[1] === cnpjDigits ||
    destMatch?.[1] === cnpjDigits ||
    anyCnpjMatch?.[1] === cnpjDigits

  if (!cnpjFound) {
    return {
      valid: false,
      reason: "CNPJ da Biohelp não encontrado no XML.",
      metadata: {
        format,
        emitFound: emitMatch?.[1] ?? null,
        destFound: destMatch?.[1] ?? null,
      },
    }
  }

  return {
    valid: true,
    metadata: {
      format,
      tag: emitMatch?.[1] === cnpjDigits ? "emit" : destMatch?.[1] === cnpjDigits ? "dest" : "other",
    },
  }
}

/** True se `text` contém uma sequência exata de digits do CNPJ ignorando separadores. */
function hasDigitSequence(text: string, digits: string): boolean {
  // Concatena todos os digits do texto e procura a sequência
  const allDigits = text.replace(/\D/g, "")
  return allDigits.includes(digits)
}
