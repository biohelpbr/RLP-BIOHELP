#!/usr/bin/env node
/**
 * Aplica um arquivo .sql de supabase/migrations no projeto, via Management API.
 *
 * Uso: node scripts/aplicar-migration.mjs supabase/migrations/<arquivo>.sql
 *
 * Precisa de SUPABASE_ACCESS_TOKEN no .env.local (token de conta, não a
 * service_role — DDL não passa pelo PostgREST).
 */

import { readFileSync } from "node:fs"

const PROJECT_REF = "ikvwzfbkbwpiewhkumrj"

function lerEnv(chave) {
  const txt = readFileSync(".env.local", "utf8")
  const linha = txt.split("\n").find((l) => l.startsWith(`${chave}=`))
  if (!linha) return null
  return linha.slice(chave.length + 1).trim().replace(/^["']|["']$/g, "")
}

const arquivo = process.argv[2]
if (!arquivo) {
  console.error("uso: node scripts/aplicar-migration.mjs <caminho.sql>")
  process.exit(1)
}

const token = lerEnv("SUPABASE_ACCESS_TOKEN")
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN ausente no .env.local")
  process.exit(1)
}

const sql = readFileSync(arquivo, "utf8")
console.log(`aplicando ${arquivo} (${sql.length} bytes)…`)

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  },
)

const corpo = await res.text()
if (!res.ok) {
  console.error(`ERRO HTTP ${res.status}`)
  console.error(corpo.slice(0, 800))
  process.exit(1)
}
console.log(`HTTP ${res.status} — aplicada`)
console.log(corpo.slice(0, 400))
