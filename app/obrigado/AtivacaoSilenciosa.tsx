"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { claimPreRegistration } from "@/app/welcome/actions"

/**
 * Funil Creators Hub — faz a MESMA ativação da /welcome (marca pago, cria a
 * conta, estabelece a sessão), só que por baixo dos panos: a pessoa já vê os
 * 3 passos, sem passar pela tela "Confirmando seu acesso…" do clube.
 *
 * Recebe os mesmos parâmetros que a Guru envia hoje pra /welcome.
 * Não renderiza nada. Falha aqui não trava a página — o webhook do Guru é a
 * rede de segurança que ativa o membro do lado do servidor.
 */
export function AtivacaoSilenciosa() {
  const params = useSearchParams()

  React.useEffect(() => {
    const externalId = params.get("external_id")
    // Guru não faz URL-encode do e-mail: o "+" de alias chega como espaço.
    const email = params.get("email")?.replace(/ /g, "+") ?? null
    if (!externalId && !email) return // acesso direto à página, sem compra

    let cancelado = false
    ;(async () => {
      try {
        const r = await claimPreRegistration({
          external_id: externalId,
          transaction_id: params.get("tx"),
          email,
          name: params.get("name"),
          phone: params.get("phone") ?? params.get("phone_number"),
        })
        if (!cancelado && !r.ok) {
          console.error("[obrigado] ativação não concluída:", r.error)
        }
      } catch (err) {
        console.error("[obrigado] ativação falhou (non-fatal)", err)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [params])

  return null
}
