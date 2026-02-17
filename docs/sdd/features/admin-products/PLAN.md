# PLAN — Página de Produtos (Admin)

## Backend
- `GET /api/admin/products` — requer admin auth
- Chama Shopify REST API: `GET /products.json?limit=50&fields=id,title,images,variants,status,product_type`
- Para cada produto, busca metafield `custom.cv` via batch
- Retorna lista consolidada

## Frontend
- `app/admin/products/page.tsx` — grid de cards de produtos
- `app/admin/products/page.module.css` — estilo consistente com admin

## Sidebar
- `admin/page.tsx` — link "Produtos" aponta para `/admin/products`
- `admin/commissions/page.tsx` — idem
- Remover link "Configurações" de ambos
