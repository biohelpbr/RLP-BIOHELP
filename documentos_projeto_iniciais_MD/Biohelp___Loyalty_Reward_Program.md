# Biohelp   Loyalty Reward Program

Biohelp Nutrition Club

Loyalty Reward Program (LRP)

# Contexto

A Biohelp é uma marca de suplementos que atende o público das classes A e B, mulheres, de 25 a 45 anos, que buscam uma vida mais saudável através de suplementação limpa.

Recentemente, a empresa fechou parceria estratégica com uma influenciadora que tem em sua audiência milhares de mulheres que anseiam não só por saúde, mas também por propósito de levar essa mensagem adiante. Assim, planejamos o Nutrition Club da Biohelp.

O Nutrition Club da Biohelp é um Loyalty Reward Program (LRP) que transforma clientes engajadas em parceiras da marca, criando uma rede de consultoras de suplementação com diferentes níveis de participação. O modelo combina vantagens exclusivas na compra de produtos com uma estrutura de incentivos que remunera o esforço de recomendação, ativação de novas parceiras e construção de rede.

A proposta é oferecer múltiplas vias de crescimento: desde clientes que desejam apenas equilibrar seus custos de suplementação, passando por quem busca uma renda complementar, até pessoas interessadas em desenvolver uma renda profissional estruturada dentro de um sistema sustentável.

# Objetivo

Painel para gestão do programa: área administrativa para acesso de integrantes da Biohelp. As funcionalidades serão detalhadas nas Metas de Usuário Admin.

Painel de performance individual: área privada para acesso das parceiras registradas no programa. As funcionalidades serão detalhadas nas Metas de Usuário Admin.

# Metas de Visitante/Cliente COM Link

Cliente chega ao site com link -> Vê o preço especial para membros -> Clica em tornar-se membro -> É redirecionado para o LRP para fazer o cadastro -> O LRP pega a utm/ref/cookies passado junto no redirecionamento -> Preenche os dados (Nome, Email, Endereço ?) -> O LRP registra no banco de dados com as tags, informações etc e põe ela na rede a qual ela pertence -> O LRP cria/atualiza o cliente na Shopify com as tags (quem referenciou ele), informações pessoais (nome, email, endereço(?)) etc -> O cliente é redirecionado de volta para a loja na página de login da Shopify, só assim para liberar os preços especiais -> O cliente faz login na loja usando o mesmo email do cadastro no LRP -> O cliente tem acesso aos preços especiais de membro.

# Metas de Visitante Cliente SEM Link

Cliente chega ao site frio, sem link -> Vê o preço de membro -> Clica em tornar-se membro -> É redirecionado para o LRP para fazer o cadastro -> Preenche os dados (Nome, Email, Endereço?) -> O LRP cria o cliente com as tags, informações e - como ele não veio por indicação - põe ele em uma alguma rede existente específica ou aleatória ou o deixa como fundador de uma rede nova (ainda não foi definido) -> O LRP cria o cliente no banco de dados com as tags (com quem é o superior dele, se houver!), informações(nome, email, endereço(?)), etc. -> O LRP cria/atualiza o cliente na Shopify com as tags (quem referenciou ele), informações pessoais (nome, email, endereço(?)) etc -> O cliente é redirecionado de volta para a loja/página de login -> O cliente faz login na loja usando o mesmo email do cadastro no LRP -> O cliente tem acesso aos preços de membro.

# Metas de Membro -> Comprar para si próprio

O cliente cadastrado (e logado!) faz uma compra para si próprio com desconto de membro -> Ao acessar seu painel LRP verá seu status mudar de inativo para ativo assim que ele obtiver 200 CV de consumo próprio.

Obs 1: Cada produto na Shopify tem um Metacampo chamado CV -> Fluxo no Shopify Flow calcula o total de CV do pedido -> Esse valor pode ser registrado em um Metacampo do cliente, somando ao valor já acomulado -> quando o CV mensal chega em 200, o cliente recebe a tag de Ativo -> Quando o mês termina, esse valor deve ser zerado e a tag deve mudar para Inativo.

Obs 2: Achamos interessante manter o fluxo no Flow como redundância, mas o melhor é ter um fluxo de soma de CV também através do LRP que através de API também pode receber eventos de vendas com todos dados relacionados.

# Metas de Membro -> Indicar para outra pessoa

O Membro acessa seu painel individual e copia seu link único -> Divulga para sua rede de contatos e espera que converta em vendas para novos membros (não adianta gerar vendas se o cliente não se tornar membro!) -> Ao gerar vendas, visualiza o valor de CV de sua rede acumulado por período (esse valor se soma ao CV de compras individuais do membro, mas devem aparecer separadamente no painel).

# Metas de Membro -> Outras

- O Membro acessa seu painel individual e visualiza o seu nível (membro, parceira, líder, diretora e head; requisitos em anexo)

- O Membro acessa seu painel individual e visualiza saldo geral a receber; e o saldo em análise (regras da trava em anexo)

- O Membro deve passar por uma atualização de cadastro ao realizar o pedido de saque (regras em anexo)

- O Membro pode visualizar a árvore de sua rede de indicações, mostrando o contato de cada pessoa, nível de cada pessoa, CV de cada pessoa, se está ativo ou inativo.

- O Membro pode entender melhor o saldo a receber por tipo de fonte de comissão:

- Fast Track (regra em anexo) -> além de ver o que tem de saldo, deve expandir mais detalhes.

- Comissão Perpétua (regras em anexo) -> além de ver o que tem de saldo, deve expandir mais detalhes.

- Bônus3 (regras em anexo) -> além de ver o que tem de saldo, deve expandir mais detalhes.

- Leadership Pool ->

# Metas de Usuário Admin

- O Admin deve poder cadastrar outros Admins

- O admin deve poder ter uma visão geral de todas as redes:

- Quantos membros cadastrados existem

- Quantos membros ativos

- Quantas pessoas de cada nível

- Qual o CV global

- Qual a comissão globa

- O admin também deve poder filtrar essas informações por cada um dos modos de comissionamento (fast-track, perpétua, bônus 3, leadership), ou seja, quanto CV será comissionado em cada modo, quantas pessoa ativas há em cada modo, etc.

- O Admin deve Poder visualizar a rede de cada Membro e ver todos os dados referentes a ele, da mesma forma que o próprio Membro poderá.

- O Admin deve ser capaz de alterar as informações do Membro, ajustar seu CV e comissão, ajustar o Nível, bloquear o Membro e trocá-lo de rede.

- O Admin deve poder dar/alterar/remover Tags dos Membros, assim como usar essas tags como filtro. Se possível, essas informações devem ser refletidas para a Shopify.

# Anexos

CV (Commissionable Value / Valor Comissionavel)

- 1 CV é igual a R$ 1,00

- Cada produto da Biohelp vai gerar um CV diferente, exemplo, o Lemon Dreams que venderemos a R$159,00, será gerado um CV de 77.

Níveis da Rede:

- N0 é o início de uma rede qualquer, N1 é qualquer Membro no primeiro nível, diretamente abaixo da N0. N2 é qualquer Membro dois níveis abaixo da N0.

- A N”X” de uma rede é a N0 de sua própria rede. Ou seja, mesmo que ela entre como N2 da rede de alguém, ela é ao mesmo tempo N0 da sua própria rede.

Funcionalidades Básicas:

- A cliente deve poder se cadastrar como Membro.

- Após cadastrado o membro tem acesso a preços especiais. (entra no nutrition club - Na shopify conseguimos separar isso).

- O Membro tem um link personalizado que pode enviar para outros clientes se cadastrarem como Membros.

- Esse novo Membro estará na rede do Membro que a convidou (no nível imediatamente abaixo).

- O Membro deve poder ver sua rede, sua comissão e status (ativa / inativa).

- A Parceira deve poder solicitar o saque de sua comissão a receber (provavelmente precisaremos de um fintech)

- Se for saque até R$ 990,00/Mês, poderá sacar como PF e a biohelp tem que gerar uma RPA contra a Parceira;

- Se for sacar acima de R$990,00, terá que obrigatoriamente anexar NF antes do pgto ser autorizado. Em caso de CNPJ MEI, poderá ser conta pessoa física; Se o CNPJ for outra classificação, terá que ser conta PJ; Conta precisará sempre ser em nome da parceira, não poderá efetuar saque em nome de terceiros.

Status de Atividade:

- Para a parceira ser elegível à comissão, ela deve gerar um mínimo de CV mensal de 200 pontos, se tornando uma parceira “Ativa” e passando a ficar habilitada para receber as comissões.

- Sempre que a parceira se torna “Inativa” ela não recebe nenhum de seus benefícios durante seu mês de inatividade.

- Se ela se ativa no mês subsequente, volta ao ranking que estava.

- Depois de 6 meses sem se ativar, ela perde totalmente o status.

- Depois que a parceira perde totalmente o status e sai da rede, sua rede que estava abaixo sobe o nível e fica abaixo de quem estava acima da parceira.

Níveis de Liderança:

- Membro: é uma cliente cadastrada

- Parceira: é um Membro Ativo quem tem 500 CV em sua rede (inclui o próprio Membro)

- Líder em Formação: Esse não é um nível de fato, mas um status que a Parceira atinge quando traz sua primeira parceira para sua rede. quando isso acontece, ela passa a receber os bonûs como se já fosse uma líder, mas por apenas 90 dias. Caso no fim desse período ela não tenha atingido os requisitos de Líder, ela volta a receber comissão de Parceira.

- Líder: Parceira Ativa (N0) que possui outras 4 Parceiras (N1) Ativas no primeiro nível de sua rede.

- Se a Líder tem 4 ativas abaixo e 1 não se ativa, logo, ela perde o status de líder e o comissionamento correspondente do nível de Liderança na comissão perpétua;

- Diretora: Para ser diretora, a N0 precisa ter no mínimo 3 Líderes (N1) Ativas e 80.000 CV em sua rede.

- Head: Para ser Head, a N0 precisa ter no mínimo 3 Diretoras (N1) Ativas e 200.000 CV em sua rede.

- Caso alguém saia da rede de forma que algum desses requisitos deixem de ser atendidos, a Parceira desce de cargo.

Regras de Comissionamento:

Creatina Mensal Grátis:

- Todo Membro Ativo (200 CV) recebe uma creatina mensal grátis.

Fast-Track:

- Quando uma Parceira (N0) traz um novo membro por meio de seu link, independente desse membro atingir o cv mínimo, ela (N0) receberá, nos primeiros 30 dias, uma comissão equivalente a 30% do CV sobre as compras realizadas pela Parceira (N1), e de 20% nos 30 dias seguintes.

- A Líder (N0) recebe 20% e 10% do CV sobre as compras dessas clientes (N2) (mesma regra de tempo)

- A Líder continuará recebendo 30% / 20% dos membros (N1) que ela trouxer.

Comissão Perpétua:

- Se a N0 estiver recebendo comissão Fast-Track de uma parceira (N1), só passará a receber a Comissão Perpétua referente a essa Parceira quando os 60 dias do Fast-Track terminarem.

- A Parceira (N0) recebe 5% do CV das clientes que ela trouxe (N1 somente)

- A Líder (e a Líder em Formação) recebe 7% do CV de sua rede inteira e 5% do CV das clientes que ela trouxe (N1 somente)

- A Diretora recebe 10% do CV de sua rede inteira, 7% do CV das parceiras que ela trouxe (N1 somente) e 5% do CV das clientes que ela trouxe (N1 somente)

- A Head recebe 15% do CV de sua rede inteira, 10% do CV das Líderes que ela trouxe (N1 somente), 7% do CV das parceiras que ela trouxe (N1 somente) e 5% do CV das clientes que ela trouxe (N1 somente)

Bônus 3:

- Caso essa rede se mantenha ativa no mês seguinte, a Parceira recebe R$250,00. Podendo ocorrer em vários meses, quando completado todos os requisitos mínimos

- Caso cada uma das 3 Parceiras Ativas (N1) tenha por sua vez outras 3 Parceiras ativas abaixo de si, a Parceira (N0) recebe R$1500. Podendo ocorrer em vários meses, quando completado todos os requisitos mínimos

- Caso cada uma das 9 Parceiras Ativas (N2) tenha por sua vez outras 3 Parceiras ativas abaixo de si, a Parceira (N0) recebe R$8000. Podendo ocorrer em vários meses, quando completado todos os requisitos mínimos

- Toda essa Rede deve estar ativa para receber a bonificação.

Leadership Bônus:

- A Diretora receberá 3% do CV de sua rede como Leadership Bônus.

- A Head receberá 4% do CV de sua rede como Leadership Bônus.

Royalty

- Se uma Head (N0) formar outra Head, a rede dessa nova Head (N1) deixa de ser parte da rede antiga, mas a Head (N0) passa a receber 3% do CV dessa nova rede.

- Se a formação dessa nova Head (N1), e por consequência a separação das duas redes, fizer a Head (N0) não atender mais os requisitos para ser Head, isso NÃO fará ela deixar de ser Head.

Regras de Resgate da Comissão:

- A transferência deverá então ser realizada de forma automática, por meio de integração com alguma ferramenta terceira capaz de fazer isso, mediante a solicitação da parceira.

- Se ela for CPF só poderá sacar até X valor de uma única vez e a Biohelp deve Emitir uma RPA automaticamente, do valor que ela sacar deverá ser descontado os impostos referentes ao RPA

- Se a parceira for cadastrada como MEI ou outras modalidades de PJ, o saque do valor disponível será mediante ao envio da NFe emitida pela parceira. Para isso será necessário que o sistema valide as informações da NFe assim como a correspondência do valor informado nela com o valor disponível para saque.

- A parceira deverá ter todos os dados necessários para essas operações devidamente cadastrados

Sobre a Loja Shopify:

O controle do CV mensal do cliente será feito também no Shopify Flow, mas o Status de ativação e CV devem ser resetados a cada mês, isso é difícil de  fazer no Flow, então esse reset mensal deverá ser replicado a partir do LRP

Notas:

Vale notar que cada Parceira vista de forma individual pode ser considerada como N0 de sua própria rede. Sendo assim, essa parceria pode receber as comissões da rede da qual ela é o topo, independente de quantas Parceiras há acima dela.

Por exemplo, em uma rede que tenha fechado os 3 níveis do Bônus 3, a Parceira(N0) estará recebendo R$8000, as 3 Parceiras N(1) estarão recebendo R$1500 cada e as 9 parceiras(N3) estarão recebendo R$250 cada.

Também nada que as outras Parceiras(N1, N2, N3 e N4) estejam no topo de suas próprias redes formando variados níveis de Bônus 3

Uma parceira poderá ganhar comissão em todos os modelos (Fast Track, Comissão perpétua e Bônus 3), desde que atenda todos os requisitos de ativação de cada modelo. (vide exemplo abaixo).
