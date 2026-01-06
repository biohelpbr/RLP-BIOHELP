# Diagrama de Arquitetura — Biohelp LRP

> **Documento para apresentação ao cliente**  
> Sprint 1: Cadastro + Rede + Auth + Shopify Sync

---

## 1) Visão Geral do Sistema

```mermaid
flowchart TD
    subgraph BROWSER["🌐 CLIENTE - Browser"]
        direction LR
        P1["/login"]
        P2["/join"]
        P3["/dashboard"]
        P4["/admin"]
    end

    subgraph API["⚛️ NEXT.JS - API Routes"]
        direction LR
        E1["POST<br/>/api/members/join"]
        E2["GET<br/>/api/members/me"]
        E3["POST<br/>/api/admin/.../resync"]
    end

    subgraph SUPA["🗄️ SUPABASE"]
        direction LR
        AUTH[("Auth")]
        DB[("Postgres")]
    end

    subgraph SHOP["🛒 SHOPIFY"]
        direction LR
        CUST["Customer"]
        TAGS["Tags LRP"]
        LOJA["Loja Online"]
    end

    %% Conexões Browser -> API
    P1 --> AUTH
    P2 --> E1
    P3 --> E2
    P4 --> E3

    %% Conexões API -> Supabase
    E1 --> AUTH
    E1 --> DB
    E2 --> DB
    E3 --> DB

    %% Conexões API -> Shopify
    E1 --> CUST
    E3 --> CUST

    %% Shopify interno
    CUST --> TAGS
    TAGS --> LOJA
```

### Legenda de Conexões

| De | Para | Descrição |
|----|------|-----------|
| `/join` | API Join | Formulário de cadastro |
| API Join | Supabase | Cria member + auth |
| API Join | Shopify | Cria/atualiza customer |
| API Resync | Shopify | Re-sincroniza tags |
| Customer | Tags | Aplica tags LRP |
| Tags | Loja | Libera preço de membro |

---

## 2) Modelo de Dados (Supabase)

```mermaid
erDiagram
    MEMBERS {
        uuid id PK
        text name
        text email UK "único"
        text ref_code UK "imutável"
        uuid sponsor_id FK "nullable"
        text status "pending|active|inactive"
        timestamptz created_at
    }

    REFERRAL_EVENTS {
        uuid id PK
        uuid member_id FK
        text ref_code_used "nullable"
        jsonb utm_json "nullable"
        timestamptz created_at
    }

    SHOPIFY_CUSTOMERS {
        uuid id PK
        uuid member_id FK UK
        text shopify_customer_id
        timestamptz last_sync_at
        text last_sync_status "ok|failed|pending"
        text last_sync_error "nullable"
    }

    ROLES {
        uuid id PK
        uuid member_id FK UK
        text role "member|admin"
    }

    MEMBERS ||--o{ MEMBERS : "sponsor_id (rede)"
    MEMBERS ||--|| REFERRAL_EVENTS : "member_id"
    MEMBERS ||--|| SHOPIFY_CUSTOMERS : "member_id"
    MEMBERS ||--|| ROLES : "member_id"
```

---

## 3) Sincronização Supabase ↔ Shopify

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant N as ⚛️ Next.js
    participant S as 🗄️ Supabase
    participant SH as 🛒 Shopify

    Note over U,SH: Fluxo de Cadastro (Sprint 1)

    U->>N: POST /api/members/join<br/>{name, email, password, ref}
    
    N->>S: 1️⃣ Verifica email único
    S-->>N: OK
    
    N->>S: 2️⃣ Busca sponsor por ref_code
    S-->>N: sponsor_id
    
    N->>S: 3️⃣ Cria member + referral_event<br/>+ shopify_customers (pending)
    S-->>N: member criado
    
    N->>SH: 4️⃣ customerSet mutation<br/>(upsert por email)
    
    alt Shopify OK
        SH-->>N: customer.id + tags aplicadas
        N->>S: 5️⃣ Atualiza shopify_customers<br/>status = 'ok'
    else Shopify FALHA
        SH-->>N: erro
        N->>S: 5️⃣ Atualiza shopify_customers<br/>status = 'failed' + error
        Note over N: Member criado mesmo assim<br/>(SPEC seção 12)
    end
    
    N->>S: 6️⃣ signUp (Supabase Auth)
    S-->>N: JWT session
    
    N-->>U: { ok: true, redirect: "/dashboard" }
```

---

## 4) Tags Aplicadas no Shopify Customer

```mermaid
graph LR
    subgraph SUPABASE["🗄️ Supabase"]
        M[("members")]
    end

    subgraph SHOPIFY["🛒 Shopify Customer"]
        T1["lrp_member"]
        T2["lrp_ref:ABC123"]
        T3["lrp_sponsor:XYZ789"]
        T4["lrp_status:pending"]
    end

    M -->|ref_code| T2
    M -->|sponsor.ref_code| T3
    M -->|status| T4
    M -->|sempre| T1
```

### Tabela de Mapeamento

| Campo Supabase | Tag Shopify | Exemplo |
|----------------|-------------|---------|
| (sempre presente) | `lrp_member` | `lrp_member` |
| `members.ref_code` | `lrp_ref:<ref_code>` | `lrp_ref:ABC123` |
| `sponsor.ref_code` | `lrp_sponsor:<sponsor_ref_code\|none>` | `lrp_sponsor:XYZ789` |
| `members.status` | `lrp_status:<status>` | `lrp_status:pending` |

---

## 5) Fluxo de Resync (Admin)

```mermaid
sequenceDiagram
    participant A as 👔 Admin
    participant N as ⚛️ Next.js
    participant S as 🗄️ Supabase
    participant SH as 🛒 Shopify

    Note over A,SH: Admin corrige sync falhado

    A->>N: POST /api/admin/members/:id/resync-shopify
    
    N->>S: 1️⃣ Busca member + sponsor
    S-->>N: dados do member
    
    N->>SH: 2️⃣ customerSet mutation<br/>(upsert com tags atualizadas)
    
    alt Sucesso
        SH-->>N: customer.id
        N->>S: 3️⃣ Atualiza shopify_customers<br/>status = 'ok'
        N-->>A: ✅ Sync realizado
    else Falha
        SH-->>N: erro
        N->>S: 3️⃣ Atualiza last_sync_error
        N-->>A: ❌ Erro (exibir detalhes)
    end
```

---

## 6) Políticas de Segurança (RLS)

```mermaid
graph TB
    subgraph RLS["🔒 Row Level Security (Supabase)"]
        subgraph MEMBER_ROLE["Role: member"]
            M1["members: SELECT próprio registro"]
            M2["shopify_customers: SELECT próprio"]
            M3["roles: ❌ sem acesso"]
        end
        
        subgraph ADMIN_ROLE["Role: admin"]
            A1["members: SELECT todos"]
            A2["shopify_customers: SELECT/UPDATE todos"]
            A3["roles: SELECT/UPDATE"]
        end
    end

    USER["👤 JWT com role"] --> RLS
```

---

## 7) Resumo Visual para Cliente (Apresentação Executiva)

```mermaid
flowchart LR
    subgraph A["1️⃣ CADASTRO"]
        U["👤 Usuário acessa<br/>link de convite"]
    end

    subgraph B["2️⃣ SISTEMA"]
        S["🗄️ Supabase<br/>salva membro"]
    end

    subgraph C["3️⃣ SHOPIFY"]
        SH["🛒 Customer criado<br/>com tags LRP"]
    end

    subgraph D["4️⃣ RESULTADO"]
        L["🏷️ Preço de<br/>membro liberado"]
    end

    U ==>|"preenche form"| S
    S ==>|"sync automático"| SH
    SH ==>|"reconhece"| L

    style U fill:#bbdefb,stroke:#1976d2,stroke-width:2px
    style S fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style SH fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style L fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px
```

### Fluxo Simplificado em 4 Passos

| Passo | O que acontece | Onde |
|-------|---------------|------|
| **1** | Usuário clica no link de convite e preenche cadastro | `/join?ref=XXX` |
| **2** | Sistema salva o membro e vincula ao sponsor | Supabase |
| **3** | Sistema cria/atualiza customer automaticamente | Shopify |
| **4** | Cliente pode comprar com preço de membro | Loja Online |

---

## 8) Stack Tecnológica

| Componente | Tecnologia | Função |
|------------|------------|--------|
| **Frontend** | Next.js 14 (App Router) | UI + SSR |
| **Auth** | Supabase Auth | Login/Sessão JWT |
| **Database** | Supabase (Postgres) | Dados + RLS |
| **E-commerce** | Shopify Admin API | Customer + Tags |
| **Deploy** | Vercel | Hosting |

---

## Anexo: Como Visualizar Este Diagrama

1. **GitHub/GitLab**: Abre automaticamente os diagramas Mermaid
2. **VS Code**: Extensão "Markdown Preview Mermaid Support"
3. **Online**: [mermaid.live](https://mermaid.live) — cole o código e exporte PNG/SVG
4. **Notion**: Suporta blocos Mermaid nativamente

---

*Documento gerado em: Dezembro 2024*  
*Versão: Sprint 1 — MVP Operacional*

