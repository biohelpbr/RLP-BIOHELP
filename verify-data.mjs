// verify-data.mjs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
  console.log('🔍 Verificando dados no Supabase...\n');

  // Buscar membro criado
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('email', 'membro@teste.com')
    .single();

  if (memberError) {
    console.error('❌ Erro ao buscar membro:', memberError);
    return;
  }

  console.log('✅ MEMBER criado:');
  console.log('  - ID:', member.id);
  console.log('  - Nome:', member.name);
  console.log('  - Email:', member.email);
  console.log('  - Ref Code:', member.ref_code);
  console.log('  - Sponsor ID:', member.sponsor_id);
  console.log('  - Status:', member.status);
  console.log('  - Criado em:', member.created_at);

  // Buscar referral_event
  const { data: events } = await supabase
    .from('referral_events')
    .select('*')
    .eq('member_id', member.id);

  console.log('\n✅ REFERRAL_EVENTS:');
  if (events && events.length > 0) {
    events.forEach(e => {
      console.log('  - Ref usado:', e.ref_code_used);
      console.log('  - UTMs:', JSON.stringify(e.utm_json));
      console.log('  - Criado em:', e.created_at);
    });
  } else {
    console.log('  ⚠️ Nenhum evento encontrado');
  }

  // Buscar shopify_customers
  const { data: shopify } = await supabase
    .from('shopify_customers')
    .select('*')
    .eq('member_id', member.id)
    .single();

  console.log('\n✅ SHOPIFY_CUSTOMERS:');
  if (shopify) {
    console.log('  - Shopify Customer ID:', shopify.shopify_customer_id || '(não sincronizado)');
    console.log('  - Status:', shopify.last_sync_status);
    console.log('  - Último sync:', shopify.last_sync_at || '(nunca)');
    console.log('  - Erro:', shopify.last_sync_error || '(nenhum)');
  } else {
    console.log('  ⚠️ Registro não encontrado');
  }

  // Buscar role
  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('member_id', member.id)
    .single();

  console.log('\n✅ ROLE:');
  if (role) {
    console.log('  - Role:', role.role);
  } else {
    console.log('  ⚠️ Role não encontrada');
  }

  // Buscar sponsor
  if (member.sponsor_id) {
    const { data: sponsor } = await supabase
      .from('members')
      .select('name, ref_code')
      .eq('id', member.sponsor_id)
      .single();

    console.log('\n✅ SPONSOR vinculado:');
    if (sponsor) {
      console.log('  - Nome:', sponsor.name);
      console.log('  - Ref Code:', sponsor.ref_code);
    }
  }
}

verifyData().catch(console.error);

