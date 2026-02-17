# TASKS — Página de Vendas

## TASK #1: Criar API `GET /api/members/me/orders`
- [ ] Criar `app/api/members/me/orders/route.ts`
- [ ] Buscar pedidos do membro autenticado com items
- [ ] Buscar pedidos dos indicados N1
- [ ] Retornar resumo + listas

## TASK #2: Criar página `/dashboard/sales`
- [ ] Criar `app/dashboard/sales/page.tsx`
- [ ] Criar `app/dashboard/sales/page.module.css`
- [ ] Cards de resumo (Total Pedidos, CV, Valor)
- [ ] Tabela de pedidos próprios com expand para items
- [ ] Tabela de vendas da rede (N1)
- [ ] Empty state
- [ ] Loading state

## TASK #3: Atualizar sidebar
- [ ] Alterar link "Vendas" de `/dashboard` para `/dashboard/sales`
- [ ] Manter destaque ativo na rota `/dashboard/sales`

## TASK #4: Documentação
- [ ] Atualizar SPEC principal (seção 10.2 rotas)
- [ ] Atualizar ACCEPTANCE.md
- [ ] Atualizar CHANGELOG.md

## TASK #5: Build + Deploy + Teste
- [ ] `npm run build` sem erros
- [ ] Deploy Vercel
- [ ] Teste manual com dados reais
