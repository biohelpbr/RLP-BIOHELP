// create-sponsor.mjs
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSponsor() {
  console.log('Criando sponsor de teste...');

  // Criar sponsor
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      name: 'Sponsor Teste',
      email: 'sponsor@teste.com',
      ref_code: 'SPONSOR1',
      status: 'pending',
    })
    .select()
    .single();

  if (memberError) {
    if (memberError.code === '23505') {
      console.log('Sponsor já existe, buscando...');
      const { data: existing } = await supabase
        .from('members')
        .select()
        .eq('email', 'sponsor@teste.com')
        .single();
      
      if (existing) {
        console.log('✅ Sponsor encontrado:', existing);
        return existing;
      }
    } else {
      console.error('Erro ao criar sponsor:', memberError);
      process.exit(1);
    }
  }

  console.log('✅ Sponsor criado:', member);

  // Criar shopify_customers
  const { error: shopifyError } = await supabase
    .from('shopify_customers')
    .insert({
      member_id: member.id,
      last_sync_status: 'pending',
    });

  if (shopifyError && shopifyError.code !== '23505') {
    console.warn('Aviso ao criar shopify_customers:', shopifyError.message);
  } else {
    console.log('✅ shopify_customers criado');
  }

  // Criar role
  const { error: roleError } = await supabase
    .from('roles')
    .insert({
      member_id: member.id,
      role: 'member',
    });

  if (roleError && roleError.code !== '23505') {
    console.warn('Aviso ao criar role:', roleError.message);
  } else {
    console.log('✅ role criada');
  }

  console.log('\n✅ Sponsor criado com sucesso!');
  console.log('Ref code:', member.ref_code);
  console.log('Acesse: http://localhost:3000/join?ref=SPONSOR1');
}

createSponsor().catch(console.error);

