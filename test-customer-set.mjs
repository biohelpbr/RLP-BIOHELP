// test-customer-set.mjs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

const mutation = `
  mutation customerSet($input: CustomerSetInput!, $identifier: CustomerSetIdentifiers) {
    customerSet(input: $input, identifier: $identifier) {
      customer {
        id
        email
        tags
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const variables = {
  input: {
    email: 'teste-sync@example.com',
    firstName: 'Teste',
    lastName: 'Sync',
    tags: ['lrp_member', 'lrp_ref:TEST123', 'lrp_sponsor:SPONSOR1', 'lrp_status:pending'],
  },
  identifier: {
    email: 'teste-sync@example.com',
  },
};

// Testar com diferentes versões
const versions = ['2024-10', '2024-07', '2024-04', '2023-10'];

for (const version of versions) {
  console.log(`\n🧪 Testando versão ${version}...`);
  
  const url = `https://${SHOP}/admin/api/${version}/graphql.json`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });
    
    const text = await res.text();
    const json = JSON.parse(text);
    
    console.log(`Status: ${res.status}`);
    
    if (json.errors) {
      console.log('Erros:', JSON.stringify(json.errors, null, 2));
    } else if (json.data?.customerSet?.customer) {
      console.log('✅ SUCESSO! Customer criado:', json.data.customerSet.customer.id);
      console.log('Tags:', json.data.customerSet.customer.tags);
      break;
    } else if (json.data?.customerSet?.userErrors) {
      console.log('User Errors:', JSON.stringify(json.data.customerSet.userErrors, null, 2));
    } else {
      console.log('Resposta:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

