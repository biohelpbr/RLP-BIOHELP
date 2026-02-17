# PLAN — Página de Vendas

## Arquitetura

### Backend (API)
- **Novo endpoint:** `GET /api/members/me/orders`
  - Autenticação via `getCurrentMember()`
  - Busca pedidos do membro em `orders` JOIN `order_items`
  - Busca pedidos da rede (N1) via `members.sponsor_id`
  - Retorna: resumo + lista de pedidos próprios + lista de vendas da rede

### Frontend (Página)
- **Rota:** `/dashboard/sales`
- **Componente:** `app/dashboard/sales/page.tsx` (client component)
- **Estilo:** `app/dashboard/sales/page.module.css` (dark theme, consistente com commissions)

### Dados (Supabase)
- Tabela `orders` (RLS: member lê seus próprios)
- Tabela `order_items` (RLS: member lê seus próprios)
- Para N1: usa `service_client` para buscar pedidos dos indicados diretos

### Fluxo
1. Página carrega → chama `GET /api/members/me/orders`
2. API busca member_id do autenticado
3. Busca pedidos próprios com items
4. Busca indicados diretos (N1) e seus pedidos
5. Retorna JSON consolidado
6. Frontend renderiza cards + tabelas

## Decisões Técnicas
- Usar `service_client` no backend para buscar pedidos da rede (bypass RLS controlado)
- Limitar pedidos da rede a N1 diretos (performance)
- Paginação simples (últimos 50 pedidos por padrão)
