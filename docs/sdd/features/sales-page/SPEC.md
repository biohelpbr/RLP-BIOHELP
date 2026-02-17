# SPEC — Página de Vendas (Dashboard do Membro)

## Contexto
O sidebar do dashboard já possui o item "Vendas" que atualmente redireciona para `/dashboard`.
Esta feature cria a página real em `/dashboard/sales` para exibir os pedidos do membro e de sua rede.

## FRs Relacionados
- **FR-13** (Webhooks de pedidos) — dados já disponíveis nas tabelas `orders` e `order_items`
- **FR-14** (Cálculo de CV) — CV por item/pedido já calculado
- **FR-17** (Separação CV próprio vs rede) — exibir vendas próprias e da rede separadamente
- **RLS 14.4** — Member pode ler apenas seus próprios pedidos

## Seções do SPEC Principal
- Seção 5.7 (Separação de CV próprio vs rede)
- Seção 13.5 (Tabela `orders`)
- Seção 13.6 (Tabela `order_items`)
- Seção 14.4 (RLS de orders)

## Requisitos Funcionais

### RF-V1: Resumo de Vendas
- Cards com: Total de Pedidos, CV Total dos Pedidos, Valor Total
- Separar: Minhas Compras vs Vendas da Rede (N1)

### RF-V2: Lista de Pedidos Próprios
- Tabela com: Pedido #, Data, Itens, Valor, CV, Status
- Ordenação por data (mais recente primeiro)
- Status visual: Pago (verde), Reembolsado (vermelho), Cancelado (cinza)

### RF-V3: Vendas da Rede (N1)
- Tabela com pedidos dos indicados diretos (N1)
- Exibe: Nome do membro, Pedido #, Data, CV, Valor
- Ajuda o membro a entender de onde vem o CV da rede

### RF-V4: Detalhes do Pedido (Expandir)
- Ao clicar em um pedido, exibe itens do pedido
- Cada item: Nome do produto, Qtd, Preço, CV

## Critérios de Aceite
- [ ] Página `/dashboard/sales` carrega em < 3s
- [ ] Exibe pedidos próprios com CV correto
- [ ] Exibe vendas da rede (N1) com CV correto
- [ ] RLS respeitado (membro só vê seus dados e N1)
- [ ] Design consistente com páginas existentes (commissions, network)
- [ ] Sidebar atualizado com link correto
