# Overview — Biohelp LRP

> 1 página com o projeto hoje. Espelho do PRD. Sem detalhes técnicos — pra detalhe técnico, ler `architecture.md`.

## O que é

Programa de fidelidade/afiliação para a marca **Biohelp** (suplementos / clube de assinatura na Shopify).

Modelo v2 (vigente desde 28/04/2026): afiliação **1 nível**, comissão 50% por assinatura de convidado, promoção a **Founder** ao atingir 5 ativos no clube, **triple resgate** (Cashin / Crédito Shopify 1:1 / PIX+NF), tags automáticas Líder (≥5) / Influenciador (≥40).

## Estado hoje (2026-05-19)

- **Sprints v2:** S1 a S5 entregues. Buffer 10-11/06. Go-live 11/06/2026.
- **Demo cliente:** 13/05/2026 ✅.
- **Switch v2 em prod:** `LRP_V2=false` (ainda OFF — aguarda validação cliente pós-demo).
- **Features Done:** F-V03, F-V05 (UI), F-V07 (UI + Cashin mock), F-V09, F-V11, F-V14, F-V15, F-V16, F-V17 (App Proxy, default OFF), F-V18.
- **Features pendentes:** F-V01 (cadastro com ref obrigatório), F-V02 (Guru via webhook Shopify), F-V04 (comissão 50% — bloqueada TBD-1/2), F-V06 (parcial — TBD-12), F-V07b live, F-V08 ranking, F-V10 WhatsApp (bloqueada TBD-16), F-V12 cleanup v1 (Onda 6).
- **TBDs abertos com cliente:** 10 (lista em `docs/sdd/PIVOT-V2.md` §4.1).

## Usuários

- **Parceira** (membro): cadastro via ref obrigatório, registra leads/vendas manuais, vê sponsor + indicados, resgata via 3 métodos.
- **Founder:** Parceira promovida; destrava cash via Cashin/PIX. Ranking entre Founders.
- **Admin Biohelp:** painel 9 áreas (Visão Geral, Comunidade, Crescimento, Consumo, Produtos, Eventos, Financeiro, Resgates, Academy). Aprovação manual saque + validação automática NF.

## Não-objetivos (pós-MVP)

- Foto-comida → calorias.
- Registro de treino + integrações Apple Watch / Google Fit.
- Gamificação "Iron Man".
- `admin/Alerts` e `admin/Settings`.

## Referências canônicas

- `docs/sdd/PIVOT-V2.md` — fonte v2.
- `docs/sdd/PLAYBOOK.md` — workflow.
- `docs/sdd/features/F-VNN-*/SPEC.md` — por feature.
- `docs/STATUS_IMPLEMENTACAO.md` — progresso.
