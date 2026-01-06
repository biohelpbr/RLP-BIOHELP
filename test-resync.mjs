// test-resync.mjs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { syncMemberToShopify } from './lib/shopify/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testResync() {
  console.log('🔄 Testando resync do membro...\n');

  // Buscar membro criado
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('email', 'membro@teste.com')
    .single();

  if (!member) {
    console.error('❌ Membro não encontrado');
    return;
  }

  // Buscar sponsor
  let sponsorRefCode = null;
  if (member.sponsor_id) {
    const { data: sponsor } = await supabase
      .from('members')
      .select('ref_code')
      .eq('id', member.sponsor_id)
      .single();
    sponsorRefCode = sponsor?.ref_code || null;
  }

  console.log('Membro:', member.name);
  console.log('Ref Code:', member.ref_code);
  console.log('Sponsor Ref:', sponsorRefCode);
  console.log('\nExecutando sync...\n');

  const result = await syncMemberToShopify({
    memberId: member.id,
    email: member.email,
    name: member.name,
    refCode: member.ref_code,
    sponsorRefCode,
  });

  if (result.success) {
    console.log('✅ Sync realizado com sucesso!');
    console.log('Shopify Customer ID:', result.shopifyCustomerId);
  } else {
    console.log('❌ Sync falhou:');
    console.log('Erro:', result.error);
  }
}

testResync().catch(console.error);

