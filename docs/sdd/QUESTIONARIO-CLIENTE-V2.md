# Questionário do Cliente — Pivô V2

> Texto pronto pra copiar e colar no WhatsApp do cliente. Formatação simples (negrito com *, itálico com _) — o WhatsApp renderiza tudo. Cada bloco é uma "rajada" curta, separada por linha em branco, pra não criar uma parede de texto.

---

## VERSÃO 1 — Mensagem única (mais formal, melhor pra registro)

```
🚀 *BIOHELP LRP — Decisões pendentes pra destravar o desenvolvimento*

Oi! Com base no fluxograma novo e nos seus comentários no escopo, mapeei *18 pontos* que precisam da sua decisão antes da gente começar a codar. Pode responder por número (ex.: "1) sempre 50%; 2) LRP retém"), na ordem que for mais cômoda. Quanto antes destravar, mais rápido entrega.

━━━━━━━━━━━━━━
💰 *COMISSÃO E IMPOSTOS*
━━━━━━━━━━━━━━

*1.* O percentual é *sempre 50%* ou tem casos diferentes?
(ex.: produto x assinatura, primeira compra x renovação, primeiro mês x demais)

*2.* "Menos impostos e taxas" — *quem desconta*?
( ) LRP retém ISS/IR antes de pagar o membro
( ) Repassa bruto e o membro se vira com NF
( ) Outro: ___

━━━━━━━━━━━━━━
💳 *PAGAMENTO AO MEMBRO*
━━━━━━━━━━━━━━

*3.* *Asaas* é obrigatório ou aceita PIX/TED manual também?

*4.* Tem *aprovação manual* antes da transferência ou é automática após a NF ser validada?

*5.* *CPF está totalmente fora*? Membro só pode receber como PJ com NF de serviço?

━━━━━━━━━━━━━━
🔌 *INTEGRAÇÕES EXTERNAS*
━━━━━━━━━━━━━━

*6.* O *ERP* (que gera NF de venda no fluxo de produto) tem API pra a gente integrar, ou nessa fase é registro manual?

*7.* O *Guru* envia webhook direto pro nosso app quando a assinatura é paga, ou ele só cria o pedido na Shopify e a gente lê via webhook Shopify?

━━━━━━━━━━━━━━
🔗 *CADASTRO E CÓDIGO DE INDICAÇÃO*
━━━━━━━━━━━━━━

*8.* Se um membro fica *inativo*, o *link/código* dele continua valendo pra trazer novos cadastros, ou bloqueia automaticamente?

*9.* O *código manual* de indicação é imutável (igual ao link), ou pode ser regerado/expirado? Pode ser reusado se o membro inativar e reativar?

*10.* Hoje existe a "House Account" (conta-mãe) que recebe quem cadastra sem link. Como agora *cadastro sem ref será bloqueado*, a House Account *deve ser descontinuada* ou continua existindo pra alguma outra finalidade?

━━━━━━━━━━━━━━
👑 *FOUNDER E RANKING*
━━━━━━━━━━━━━━

*11.* Critério do *ranking de Founder* — qual é a régua?
( ) Tamanho do clube (nº de membros ativos)
( ) Faturamento total da rede
( ) Média mensal de itens por cliente
( ) Combinação dos acima — qual peso?
( ) Outro: ___

*12.* Founder pode *"perder o status"* se cair abaixo de 5 ativos no clube, ou uma vez Founder sempre Founder?

━━━━━━━━━━━━━━
💼 *SALDO E CRÉDITOS*
━━━━━━━━━━━━━━

*13.* Pre-Founder: *prazo de validade* do saldo? Tem X dias pra converter em crédito antes de "expirar"? Qual X?

*14.* Conversão *saldo → crédito Shopify*: é 1:1 (R$1 = R$1 de crédito) ou tem ágio? O crédito tem prazo de validade na loja?

━━━━━━━━━━━━━━
📺 *CONTEÚDO E COMUNIDADE*
━━━━━━━━━━━━━━

*15.* A área de *conteúdo* (texto / vídeo / pdf) — *quem posta*?
( ) Só o admin (é uma central global pra todos os membros)
( ) Cada Founder tem o próprio mural pro clube dele
( ) Os dois (admin global + mural por Founder)

*16.* O *link do grupo de WhatsApp* por Founder — admin valida antes de publicar, ou o Founder posta direto?

━━━━━━━━━━━━━━
♻️ *COISAS JÁ FEITAS NO V1 — MANTÉM OU CORTA?*
━━━━━━━━━━━━━━

*17.* O *cupom mensal de creatina* (membro ativo recebia 1 cupom de 100% off) — *mantém* como benefício no v2 ou descontinua?

*18.* Já implementamos o fluxo de *saque RPA / CPF* (com limite R$1.000/mês) no Sprint 5. Se algum membro já tá usando, *podemos cortar imediatamente* e mostrar só "indisponível", ou tem que dar prazo de transição? *Quantos membros já usaram saque hoje?*

━━━━━━━━━━━━━━

Quando responder os 18, eu já transformo cada decisão em feature classificada e a gente começa pela *F-V01 (cadastro com ref obrigatório)*, que é a porta de entrada do novo fluxo. Qualquer dúvida em alguma pergunta, me sinaliza que eu reescrevo. 👊
```

---

## VERSÃO 2 — Em rajadas curtas (melhor pra conversa real, várias mensagens)

> Cada bloco abaixo é UMA mensagem separada no WhatsApp. Manda na sequência, com pausas pro cliente responder em partes.

### Mensagem 1 — abertura
```
Oi! Antes de começar a codar as mudanças do novo modelo, preciso de 18 decisões suas. Vou mandar em blocos curtos. Pode responder na ordem que quiser. 👇
```

### Mensagem 2 — comissão
```
*1) COMISSÃO*

A regra é sempre 50% sobre a assinatura do convidado, ou muda em alguns casos? (ex.: produto vs assinatura, primeira compra vs renovação)

*2) IMPOSTOS*

"Menos impostos e taxas" — *você quer que a gente já desconte ISS/IR antes de pagar*, ou repassa bruto e o membro se vira com a NF dele?
```

### Mensagem 3 — pagamento
```
*3, 4, 5) PAGAMENTO AO MEMBRO*

3) Asaas é obrigatório ou pode ter PIX/TED manual também?
4) Quer aprovação manual antes da transferência ou automática após NF validada?
5) CPF tá totalmente fora? Só PJ com NF de serviço pode receber?
```

### Mensagem 4 — integrações
```
*6, 7) INTEGRAÇÕES*

6) O ERP que gera NF de venda tem API ou nessa fase é manual?
7) O Guru manda webhook direto pra gente quando assinatura é paga, ou só cria pedido na Shopify e a gente lê de lá?
```

### Mensagem 5 — cadastro e código
```
*8, 9, 10) CADASTRO E REF*

8) Se um membro fica inativo, o link/código dele continua trazendo novos cadastros ou bloqueia?
9) O código manual de indicação é imutável (como o link) ou pode ser trocado/expirar?
10) Hoje quem se cadastra sem link cai numa "House Account". Como agora ref vai ser obrigatório, a House Account some ou continua pra alguma outra coisa?
```

### Mensagem 6 — Founder
```
*11, 12) FOUNDER*

11) O ranking dos Founders é baseado em quê? Tamanho do clube? Faturamento? Média de itens por cliente? Combinação?
12) Se um Founder cair abaixo de 5 ativos no clube, ele perde o status, ou uma vez Founder sempre Founder?
```

### Mensagem 7 — saldo
```
*13, 14) SALDO E CRÉDITOS*

13) Saldo do pre-Founder tem prazo de validade? Quantos dias pra converter em crédito antes de expirar?
14) Saldo → crédito Shopify é 1:1 ou tem ágio? Crédito Shopify tem validade?
```

### Mensagem 8 — conteúdo
```
*15, 16) CONTEÚDO E COMUNIDADE*

15) A área de conteúdo (vídeo, pdf, texto) — só admin posta global pra todo mundo, ou cada Founder tem o mural dele?
16) Link do grupo de WhatsApp por Founder — admin valida antes ou o Founder publica direto?
```

### Mensagem 9 — o que cortar do que já tá feito
```
*17, 18) JÁ ESTÁ EM PRODUÇÃO — MANTÉM OU CORTA?*

17) Cupom mensal de creatina (membro ativo recebia 1 cupom 100% off) — mantém como benefício no v2 ou descontinua?
18) O fluxo de saque RPA/CPF (limite R$1.000/mês) está implementado e em uso. Quantos membros usaram até agora? Posso cortar imediatamente quando o v2 entrar, ou precisa prazo de transição?
```

### Mensagem 10 — fechamento
```
Quando responder, eu transformo cada decisão em feature, classifico, e a gente começa pelo *cadastro com ref obrigatório* (porta de entrada do novo fluxo). Qualquer dúvida em alguma pergunta, sinaliza. 👊
```

---

*Última atualização: 2026-04-28.*
