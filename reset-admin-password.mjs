// reset-admin-password.mjs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltam variáveis do Supabase no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  console.log('Resetando senha do admin...');

  const adminEmail = 'admin@biohelp.test';
  const newPassword = '123456';

  // Atualizar senha do usuário
  const { data, error } = await supabase.auth.admin.updateUserById(
    'e19cc8be-f2ac-4688-bb3a-657168ea7d8f',
    { password: newPassword }
  );

  if (error) {
    console.error('Erro ao resetar senha:', error);
    process.exit(1);
  }

  console.log('✅ Senha resetada com sucesso!');
  console.log('Email:', adminEmail);
  console.log('Nova senha:', newPassword);
}

resetAdminPassword().catch(console.error);

