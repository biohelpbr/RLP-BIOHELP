# Plano Técnico — Sprint 4 (Comissões + Ledger)

**Status:** 🚧 Em Desenvolvimento  
**Início:** 09/01/2026  
**Dependências:** Sprint 3 ✅ (Rede + Níveis concluído)

---

## Objetivo

Implementar o motor de comissões com ledger auditável, calculando em tempo real:
- Fast-Track (30%/20% nos primeiros 60 dias)
- Comissão Perpétua (por nível)
- Bônus 3 (R$250/R$1.500/R$8.000)
- Leadership Bônus (3%/4% para Diretora/Head)
- Royalty (Head forma Head)

---

## TBDs Resolvidos para este Sprint

| TBD | Decisão |
|-----|---------|
| TBD-017 | Arredondamento: 2 casas decimais (padrão BRL) |
| TBD-020 | Cálculo em tempo real (webhook orders/paid) |

## TBDs Adiados

| TBD | Motivo | Sprint |
|-----|--------|--------|
| TBD-019 | Creatina grátis (fulfillment/logística) | Sprint 5+ |
| TBD-021 | Período de trava para saque | Sprint 5 |

---

## 1. Schema do Banco de Dados

### 1.1 Tabela `commission_ledger`

Ledger imutável para auditoria de todas as comissões.

```sql
CREATE TABLE commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  
  -- Tipo de comissão
  commission_type TEXT NOT NULL CHECK (commission_type IN (
    'fast_track_30',      -- Fast-Track 30% (primeiros 30 dias)
    'fast_track_20',      -- Fast-Track 20% (dias 31-60)
    'perpetual',          -- Comissão Perpétua
    'bonus_3_level_1',    -- Bônus 3 - R$250
    'bonus_3_level_2',    -- Bônus 3 - R$1.500
    'bonus_3_level_3',    -- Bônus 3 - R$8.000
    'leadership',         -- Leadership Bônus
    'royalty',            -- Royalty (Head forma Head)
    'adjustment',         -- Ajuste manual (admin)
    'reversal'            -- Reversão (refund)
  )),
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,           -- Valor da comissão em R$
  cv_base DECIMAL(10,2),                   -- CV base usado no cálculo
  percentage DECIMAL(5,2),                 -- Percentual aplicado (ex: 30.00)
  
  -- Origem
  source_member_id UUID REFERENCES members(id),  -- Membro que gerou a comissão
  source_order_id UUID REFERENCES orders(id),    -- Pedido que gerou a comissão
  network_level INT,                             -- Nível na rede (N1, N2, etc.)
  
  -- Período
  reference_month DATE NOT NULL,           -- Mês de referência (YYYY-MM-01)
  
  -- Metadados
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices implícitos via constraints
  CONSTRAINT positive_amount CHECK (amount != 0)
);

-- Índices para consultas frequentes
CREATE INDEX idx_commission_ledger_member ON commission_ledger(member_id);
CREATE INDEX idx_commission_ledger_month ON commission_ledger(reference_month);
CREATE INDEX idx_commission_ledger_type ON commission_ledger(commission_type);
CREATE INDEX idx_commission_ledger_source_order ON commission_ledger(source_order_id);
```

### 1.2 Tabela `commission_balances` (view materializada)

Saldo atual de cada membro (calculado a partir do ledger).

```sql
CREATE TABLE commission_balances (
  member_id UUID PRIMARY KEY REFERENCES members(id),
  
  -- Saldos
  total_earned DECIMAL(10,2) DEFAULT 0,      -- Total ganho (histórico)
  total_withdrawn DECIMAL(10,2) DEFAULT 0,   -- Total sacado
  available_balance DECIMAL(10,2) DEFAULT 0, -- Disponível para saque
  pending_balance DECIMAL(10,2) DEFAULT 0,   -- Em análise/trava (Sprint 5)
  
  -- Por tipo (mês atual)
  fast_track_month DECIMAL(10,2) DEFAULT 0,
  perpetual_month DECIMAL(10,2) DEFAULT 0,
  bonus_3_month DECIMAL(10,2) DEFAULT 0,
  leadership_month DECIMAL(10,2) DEFAULT 0,
  royalty_month DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Tabela `fast_track_windows`

Controla a janela de 60 dias do Fast-Track para cada par N0-N1.

```sql
CREATE TABLE fast_track_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES members(id),     -- N0 (quem recebe)
  member_id UUID NOT NULL REFERENCES members(id),      -- N1 (quem gera)
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),       -- Início da janela
  phase_1_ends_at TIMESTAMPTZ NOT NULL,                -- Fim dos 30% (30 dias)
  phase_2_ends_at TIMESTAMPTZ NOT NULL,                -- Fim dos 20% (60 dias)
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(sponsor_id, member_id)
);

CREATE INDEX idx_fast_track_sponsor ON fast_track_windows(sponsor_id);
CREATE INDEX idx_fast_track_member ON fast_track_windows(member_id);
CREATE INDEX idx_fast_track_active ON fast_track_windows(is_active) WHERE is_active = true;
```

### 1.4 Tabela `bonus_3_tracking`

Rastreia elegibilidade para Bônus 3.

```sql
CREATE TABLE bonus_3_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  
  reference_month DATE NOT NULL,           -- Mês de referência
  
  -- Contagens
  active_partners_n1 INT DEFAULT 0,        -- Parceiras ativas em N1
  active_partners_n2 INT DEFAULT 0,        -- Parceiras ativas em N2
  active_partners_n3 INT DEFAULT 0,        -- Parceiras ativas em N3
  
  -- Bônus elegíveis
  eligible_level_1 BOOLEAN DEFAULT false,  -- 3 em N1 → R$250
  eligible_level_2 BOOLEAN DEFAULT false,  -- Cada N1 com 3 → R$1.500
  eligible_level_3 BOOLEAN DEFAULT false,  -- Cada N2 com 3 → R$8.000
  
  -- Status de pagamento
  paid_level_1 BOOLEAN DEFAULT false,
  paid_level_2 BOOLEAN DEFAULT false,
  paid_level_3 BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(member_id, reference_month)
);
```

---

## 2. Regras de Comissionamento

### 2.1 Fast-Track (primeiros 60 dias)

**Regra do documento canônico:**
- N0 recebe 30% do CV de N1 nos primeiros 30 dias
- N0 recebe 20% do CV de N1 nos próximos 30 dias (dias 31-60)
- Líder N0 recebe 20%/10% do CV de N2 (mesma regra de tempo)

**Implementação:**
```typescript
function calculateFastTrack(order: Order, buyer: Member): Commission[] {
  const commissions: Commission[] = [];
  const now = new Date();
  
  // Buscar sponsor (N0) do comprador
  const sponsor = await getSponsor(buyer.id);
  if (!sponsor) return commissions;
  
  // Verificar janela Fast-Track
  const window = await getFastTrackWindow(sponsor.id, buyer.id);
  if (!window || !window.is_active) return commissions;
  
  const orderCV = order.cv_total;
  
  // Fase 1: 30% (primeiros 30 dias)
  if (now <= window.phase_1_ends_at) {
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'fast_track_30',
      amount: orderCV * 0.30,
      cv_base: orderCV,
      percentage: 30,
      source_member_id: buyer.id,
      source_order_id: order.id,
      network_level: 1
    });
  }
  // Fase 2: 20% (dias 31-60)
  else if (now <= window.phase_2_ends_at) {
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'fast_track_20',
      amount: orderCV * 0.20,
      cv_base: orderCV,
      percentage: 20,
      source_member_id: buyer.id,
      source_order_id: order.id,
      network_level: 1
    });
  }
  
  // Se sponsor é Líder, calcular N2 (20%/10%)
  if (sponsor.level === 'lider' || sponsor.level === 'diretora' || sponsor.level === 'head') {
    const grandSponsor = await getSponsor(sponsor.id);
    if (grandSponsor) {
      const n2Window = await getFastTrackWindow(grandSponsor.id, buyer.id);
      if (n2Window?.is_active) {
        const rate = now <= n2Window.phase_1_ends_at ? 0.20 : 0.10;
        const type = now <= n2Window.phase_1_ends_at ? 'fast_track_30' : 'fast_track_20';
        commissions.push({
          member_id: grandSponsor.id,
          commission_type: type,
          amount: orderCV * rate,
          cv_base: orderCV,
          percentage: rate * 100,
          source_member_id: buyer.id,
          source_order_id: order.id,
          network_level: 2
        });
      }
    }
  }
  
  return commissions;
}
```

### 2.2 Comissão Perpétua (após Fast-Track)

**Regra do documento canônico:**
- Parceira: 5% CV de N1
- Líder: 7% CV da rede + 5% CV de N1
- Diretora: 10% CV da rede + 7% CV de Parceiras N1 + 5% CV de clientes N1
- Head: 15% CV da rede + 10% CV de Líderes N1 + 7% CV de Parceiras N1 + 5% CV de clientes N1

**Tabela de percentuais:**

| Nível N0 | % Rede | % N1 Líder | % N1 Parceira | % N1 Cliente |
|----------|--------|------------|---------------|--------------|
| Parceira | - | - | - | 5% |
| Líder | 7% | - | - | 5% |
| Diretora | 10% | - | 7% | 5% |
| Head | 15% | 10% | 7% | 5% |

### 2.3 Bônus 3

**Regra do documento canônico:**
- 3 Parceiras Ativas em N1 por 1 mês → R$250
- Cada N1 com 3 Parceiras Ativas → R$1.500
- Cada N2 com 3 Parceiras Ativas → R$8.000

**Implementação:** Job mensal que verifica elegibilidade e paga bônus.

### 2.4 Leadership Bônus

**Regra do documento canônico:**
- Diretora: 3% CV da rede
- Head: 4% CV da rede

### 2.5 Royalty

**Regra do documento canônico:**
- Head N0 forma Head N1 → rede N1 separa
- N0 recebe 3% CV da nova rede
- Separação não faz N0 perder status de Head

---

## 3. APIs

### 3.1 GET /api/members/me/commissions

Retorna resumo de comissões do membro logado.

**Response:**
```json
{
  "balance": {
    "total_earned": 1500.00,
    "total_withdrawn": 500.00,
    "available": 1000.00,
    "pending": 0.00
  },
  "current_month": {
    "fast_track": 250.00,
    "perpetual": 150.00,
    "bonus_3": 0.00,
    "leadership": 0.00,
    "royalty": 0.00,
    "total": 400.00
  },
  "history": [
    {
      "month": "2026-01",
      "total": 400.00,
      "breakdown": { ... }
    }
  ]
}
```

### 3.2 GET /api/members/me/commissions/details

Retorna detalhes do ledger (para expandir cada tipo).

### 3.3 GET /api/admin/commissions

Lista todas as comissões (admin).

### 3.4 POST /api/admin/commissions/adjustment

Permite ajuste manual (admin).

---

## 4. UI Components

### 4.1 Dashboard do Membro

- Card de saldo total
- Breakdown por tipo de comissão
- Gráfico de evolução mensal
- Lista de últimas comissões

### 4.2 Admin

- Visão global de comissões
- Filtros por membro/tipo/período
- Ajustes manuais com log

---

## 5. Checklist de Implementação

- [ ] Migration: criar tabelas `commission_ledger`, `commission_balances`, `fast_track_windows`, `bonus_3_tracking`
- [ ] RLS: políticas de segurança
- [ ] Lib: `lib/commissions/calculator.ts`
- [ ] Lib: `lib/commissions/fast-track.ts`
- [ ] Lib: `lib/commissions/perpetual.ts`
- [ ] Lib: `lib/commissions/bonus-3.ts`
- [ ] Lib: `lib/commissions/leadership.ts`
- [ ] Lib: `lib/commissions/royalty.ts`
- [ ] Webhook: integrar cálculo no `orders/paid`
- [ ] Webhook: integrar reversão no `orders/refunded`
- [ ] API: `/api/members/me/commissions`
- [ ] API: `/api/members/me/commissions/details`
- [ ] API: `/api/admin/commissions`
- [ ] UI: Card de comissões no dashboard
- [ ] UI: Página de detalhes de comissões
- [ ] UI: Admin - visão de comissões
- [ ] Testes: Fast-Track 30 dias
- [ ] Testes: Transição Fast-Track → Perpétua
- [ ] Testes: Bônus 3 níveis
- [ ] Deploy e validação

---

## 6. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Cálculo incorreto de comissões | Ledger imutável + testes extensivos |
| Performance em redes grandes | Índices otimizados + cálculo incremental |
| Fraude via refund | Reversão automática via webhook |
| Duplicação de comissões | Idempotência via order_id único |

---

## 7. Definition of Done

- [ ] Todas as tabelas criadas e com RLS
- [ ] Todas as APIs funcionando
- [ ] UI implementada e responsiva
- [ ] Testes manuais passando
- [ ] Deploy em produção
- [ ] `STATUS_IMPLEMENTACAO.md` atualizado
- [ ] `ACCEPTANCE.md` checklist marcado

