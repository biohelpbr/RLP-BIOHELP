/**
 * F-V07b: Cashin client com interface agnóstica.
 *
 * 3 implementações: mock (default dev) | sandbox (HTTP real, ambiente teste)
 * | live (placeholder, requer credenciais prod). Decisão via env CASHIN_MODE.
 *
 * Anti-SPEC §11: provider agnóstico — manter interface estável pra permitir
 * troca de provider futuro (Asaas, Pagar.me, etc) sem refactor.
 */

export type CashinTransferInput = {
  amount: number
  pixKey: string
  payoutId: string
  /** Documentação opcional do beneficiário (CPF/CNPJ) — alguns provedores exigem. */
  beneficiaryDocument?: string
  beneficiaryName?: string
}

export type CashinTransferResult =
  | { ok: true; transactionId: string; status: "processing" | "paid" }
  | { ok: false; error: string; code?: string }

export type CashinStatusResult =
  | { ok: true; status: "processing" | "paid" | "failed"; transactionId: string }
  | { ok: false; error: string }

export interface CashinClient {
  transfer(input: CashinTransferInput): Promise<CashinTransferResult>
  getStatus(transactionId: string): Promise<CashinStatusResult>
}

// ===== Mock (dev default) =====
export class MockCashinClient implements CashinClient {
  async transfer(input: CashinTransferInput): Promise<CashinTransferResult> {
    if (input.amount <= 0) {
      return { ok: false, error: "amount must be > 0", code: "INVALID_AMOUNT" }
    }
    return {
      ok: true,
      transactionId: `mock_${input.payoutId}_${Date.now()}`,
      status: "processing",
    }
  }

  async getStatus(transactionId: string): Promise<CashinStatusResult> {
    return { ok: true, transactionId, status: "paid" }
  }
}

// ===== Sandbox (HTTP real ambiente Cashin sandbox) =====
type CashinSandboxConfig = {
  baseUrl: string
  apiToken: string
}

export class SandboxCashinClient implements CashinClient {
  constructor(private config: CashinSandboxConfig) {}

  async transfer(input: CashinTransferInput): Promise<CashinTransferResult> {
    if (!this.config.apiToken) {
      return { ok: false, error: "missing_api_token", code: "CONFIG_ERROR" }
    }
    try {
      const res = await fetch(`${this.config.baseUrl}/v1/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify({
          amount: input.amount,
          pix_key: input.pixKey,
          external_id: input.payoutId,
          beneficiary: {
            document: input.beneficiaryDocument,
            name: input.beneficiaryName,
          },
        }),
        cache: "no-store",
      })

      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>

      if (!res.ok) {
        return {
          ok: false,
          error: String(json.message ?? `HTTP ${res.status}`),
          code: String(json.code ?? `HTTP_${res.status}`),
        }
      }

      return {
        ok: true,
        transactionId: String(json.id ?? json.transaction_id ?? ""),
        status:
          json.status === "paid" || json.status === "completed"
            ? "paid"
            : "processing",
      }
    } catch (err) {
      return {
        ok: false,
        error: (err as Error)?.message ?? "network_error",
        code: "NETWORK_ERROR",
      }
    }
  }

  async getStatus(transactionId: string): Promise<CashinStatusResult> {
    try {
      const res = await fetch(`${this.config.baseUrl}/v1/transfers/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
        },
        cache: "no-store",
      })
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) {
        return { ok: false, error: String(json.message ?? `HTTP ${res.status}`) }
      }
      const status = json.status === "paid" || json.status === "completed"
        ? "paid"
        : json.status === "failed"
        ? "failed"
        : "processing"
      return { ok: true, transactionId, status }
    } catch (err) {
      return { ok: false, error: (err as Error)?.message ?? "network_error" }
    }
  }
}

// ===== Live (placeholder — requer creds prod) =====
export class LiveCashinClient extends SandboxCashinClient {
  constructor(config: CashinSandboxConfig) {
    super(config)
  }
}

// ===== Factory =====
export function getCashinClient(): CashinClient {
  const mode = (process.env.CASHIN_MODE || "mock").toLowerCase()
  const baseUrl = process.env.CASHIN_API_BASE_URL || "https://api-sandbox.cashin.example"
  const apiToken = process.env.CASHIN_API_TOKEN || ""

  switch (mode) {
    case "sandbox":
      return new SandboxCashinClient({ baseUrl, apiToken })
    case "live":
      return new LiveCashinClient({ baseUrl, apiToken })
    case "mock":
    default:
      return new MockCashinClient()
  }
}
