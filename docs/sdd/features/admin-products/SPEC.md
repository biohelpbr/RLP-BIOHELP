# SPEC — Página de Produtos (Admin)

## TBD-023 — Aprovado 16/02/2026

## Objetivo
Permitir que o admin visualize os produtos cadastrados na loja Shopify, com destaque para o CV configurado em cada produto, sem precisar acessar o Shopify Admin.

## Dados exibidos por produto
- Imagem (thumbnail)
- Título
- Preço
- SKU (da primeira variante)
- Status (active/draft/archived)
- CV (metafield `custom.cv`) — com indicação visual se não configurado

## API
- `GET /api/admin/products` — proxy para Shopify REST API + enriquecimento com CV

## Fora de escopo
- Editar/criar/deletar produtos
- Gerenciamento de estoque

## Critérios de Aceite
- [ ] Página `/admin/products` lista produtos da Shopify
- [ ] CV exibido ao lado de cada produto
- [ ] Produtos sem CV indicados visualmente
- [ ] Apenas admins têm acesso
- [ ] Sidebar atualizado com link funcional
- [ ] Link "Configurações" removido do sidebar
