import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/supabase/server"
import { BHCard } from "@/components/biohelp"
import { ChangePasswordForm } from "./ChangePasswordForm"

export const dynamic = "force-dynamic"

/**
 * F-V28 — Troca de senha obrigatória no primeiro acesso com senha provisória.
 * O middleware redireciona pra cá enquanto `app_metadata.must_reset_password=true`.
 */
export default async function TrocarSenhaPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BHCard variant="elevated">
          <h1 className="text-2xl font-bold text-foreground mb-2">Crie sua senha</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Você entrou com uma senha provisória. Defina agora uma senha pessoal para
            continuar — a provisória deixa de valer.
          </p>
          <ChangePasswordForm />
        </BHCard>
      </div>
    </div>
  )
}
