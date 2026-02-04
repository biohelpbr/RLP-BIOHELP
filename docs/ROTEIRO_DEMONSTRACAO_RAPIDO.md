# 🎯 Roteiro Rápido de Demonstração — Biohelp LRP
**Data:** 23/01/2026 | **Duração:** ~60 minutos

---

## 🔑 CREDENCIAIS RÁPIDAS

```
ADMIN
URL:   /admin
Email: admin@biohelp.test
Senha: 123456

PARCEIRA
URL:   /dashboard  
Email: sponsor@biohelp.test
Senha: sponsor123

LINK DE INDICAÇÃO
/join?ref=SPONSOR01
```

**URL Base (Produção):** https://rlp-biohelp-git-main-flowcodes-projects.vercel.app

---

## 📋 ROTEIRO DE EXECUÇÃO

### ⏱️ PARTE 1 — Login e Navegação (5 min)

| # | Ação | Esperado |
|---|------|----------|
| 1 | Abrir `/login` | Página de login carrega |
| 2 | Login como admin | Redireciona para `/admin` |
| 3 | Ver dashboard admin | KPIs visíveis (3 membros, 1 ativo, etc.) |
| 4 | Logout | Volta para login |
| 5 | Login como parceira | Redireciona para `/dashboard` |

---

### ⏱️ PARTE 2 — Dashboard da Parceira (10 min)

| # | Ação | O que mostrar |
|---|------|---------------|
| 1 | Ver CV no dashboard | CV: 575 | Status: Ativa | Barra verde (> 200 CV) |
| 2 | Ver nível | Nível: Parceira | Requisitos próximo nível |
| 3 | Copiar link de indicação | Link: `/join?ref=SPONSOR01` |
| 4 | Ir para `/dashboard/network` | Árvore mostra "Membro Teste" como N1 |
| 5 | Ir para `/dashboard/commissions` | Saldo: R$ 45,00 | Tipo: Fast-Track |
| 6 | Ir para `/dashboard/payouts` | Ver opção de solicitar saque |

---

### ⏱️ PARTE 3 — Cadastro Novo Membro (10 min)

| # | Ação | Esperado |
|---|------|----------|
| 1 | Abrir `/join?ref=SPONSOR01` em janela anônima | Formulário de cadastro |
| 2 | Preencher dados: | |
|   | Nome: `Demo Live Teste` | |
|   | Email: `demo.live.2601@teste.com` | |
|   | Senha: `Demo@12345` | |
| 3 | Clicar "Cadastrar" | Sucesso, redireciona para dashboard |
| 4 | Verificar dashboard | Nome, email, sponsor "Sponsor Teste", link único |
| 5 | (Opcional) Verificar Shopify Admin | Customer criado com tags LRP |

**Tags esperadas no Shopify:**
- `lrp_member`
- `lrp_ref:XXXXXXXX` (ref_code gerado)
- `lrp_sponsor:SPONSOR01`
- `lrp_status:pending`

---

### ⏱️ PARTE 4 — Painel Admin (15 min)

| # | Ação | O que mostrar |
|---|------|---------------|
| 1 | Login como admin | Dashboard com KPIs |
| 2 | Ver estatísticas | Total membros, ativos, por nível, CV global |
| 3 | Buscar membro `sponsor@biohelp.test` | Encontra e mostra dados |
| 4 | Clicar para ver detalhes | Página completa do membro |
| 5 | Ver rede do membro | N1: Membro Teste + Demo Live Teste |
| 6 | Mostrar ação "Resync Shopify" | Botão disponível |
| 7 | Mostrar ação "Ajustar Nível" | Opções de nível |
| 8 | Ver gestão de tags | CRUD de tags |
| 9 | Ir para `/admin/payouts` | Lista de saques (vazia ou com dados) |

---

### ⏱️ PARTE 5 — Sistema de Saques (10 min)

**Como Parceira:**

| # | Ação | O que mostrar |
|---|------|---------------|
| 1 | Ir para `/dashboard/payouts` | Saldo disponível: R$ 45,00 |
| 2 | Clicar "Solicitar Saque" | Formulário aparece |
| 3 | Mostrar campos | Valor, Tipo Pessoa, Dados Bancários, PIX |
| 4 | Mostrar validação | Mínimo R$ 100 (bloqueará com R$ 45) |

**Como Admin:**

| # | Ação | O que mostrar |
|---|------|---------------|
| 1 | Ir para `/admin/payouts` | Lista de solicitações |
| 2 | Mostrar filtros | Pendente, Aprovado, Rejeitado |
| 3 | (Se houver) Mostrar workflow | Aprovar, Rejeitar, Solicitar Documento |

---

### ⏱️ PARTE 6 — APIs (5 min) — OPCIONAL

**Demonstrar via Browser (DevTools → Network) ou Postman:**

| API | Resposta Esperada |
|-----|-------------------|
| `GET /api/members/me` | Dados do membro logado |
| `GET /api/members/me/cv` | CV atual, status, progresso |
| `GET /api/members/me/network` | Árvore da rede |
| `GET /api/members/me/commissions` | Resumo de comissões |
| `GET /api/members/me/free-creatine` | Elegibilidade creatina grátis |
| `GET /api/admin/stats` | KPIs globais (só admin) |

---

## ✅ CHECKLIST PRÉ-DEMONSTRAÇÃO

- [ ] Ambiente online (testar URLs)
- [ ] Credenciais funcionando
- [ ] Janela anônima pronta para cadastro
- [ ] Acesso ao Shopify Admin (se for mostrar sync)
- [ ] Gravação de tela ativada (opcional)

---

## 🎯 PONTOS-CHAVE PARA DESTACAR

### O que está 100% funcional:
1. ✅ **Cadastro com indicação** — Cria membro, vincula rede, sincroniza Shopify
2. ✅ **Autenticação** — Login, logout, proteção de rotas
3. ✅ **Dashboard do membro** — CV, status, nível, link de indicação
4. ✅ **Visualização de rede** — Árvore completa com dados dos N1, N2, etc.
5. ✅ **Sistema de comissões** — Ledger auditável, Fast-Track funcionando
6. ✅ **Dashboard admin** — KPIs, busca, gestão de membros
7. ✅ **Fluxo de saques** — Formulário, validações, workflow

### O que está parcial ou pendente:
1. ⚠️ **Integração Asaas** — Definida, aguardando credenciais
2. ⚠️ **Creatina grátis** — API pronta, falta Shopify Discount
3. ⚠️ **Cadastro sem link** — TBD-001 pendente decisão
4. ⚠️ **Webhooks reais** — Funcionam, mas precisam de pedido real na Shopify

---

## 📝 DADOS REAIS NO SISTEMA

### Membros Existentes
| Nome | Status | CV | Nível | Comissão |
|------|--------|-----|-------|----------|
| Admin Biohelp | active | 0 | membro | R$ 0 |
| Sponsor Teste | active | 575 | parceira | R$ 45 |
| Membro Teste | pending | 0 | membro | R$ 0 |

### Rede Atual
```
Sponsor Teste (SPONSOR01) ← RAIZ
    └── Membro Teste (IaUZqzPe)
        └── (possíveis novos cadastros na demo)
```

---

## 🚫 O QUE NÃO FAZER NA DEMO

1. ❌ Não alterar dados do Admin
2. ❌ Não deletar membros existentes
3. ❌ Não tentar saques sem saldo
4. ❌ Não expor tokens/secrets
5. ❌ Não simular webhooks em produção

---

## 📞 EM CASO DE PROBLEMAS

### Erro de Login
- Verificar se o ambiente está online
- Limpar cookies e tentar novamente
- Usar janela anônima

### Página não carrega
- Verificar console do navegador (F12)
- Tentar refresh
- Verificar status da Vercel

### Shopify não sincroniza
- Verificar tokens de API
- Usar "Resync Shopify" no admin
- Verificar logs no Supabase

---

**Boa demonstração!** 🚀
