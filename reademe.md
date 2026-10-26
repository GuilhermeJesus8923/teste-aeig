# API de Cobrança AEIG

Mini API de cobrança feita para o teste prático da AEIG. Ela cadastra associados, gera cobranças mensais, permite consultar uma cobrança e recebe o aviso de pagamento do banco (webhook).

## Tecnologias

1. TypeScript com Node.js
2. Express, para as rotas da API
3. SQLite, com a biblioteca better-sqlite3, como banco de dados
4. tsx, para rodar o TypeScript direto

## Como rodar

Requisito: Node.js 20 ou mais novo.

1. Instale as dependências:

```
npm install
```

2. Suba o servidor:

```
npx tsx src/index.ts
```

3. Deve aparecer "Servidor rodando na porta 3000". A API fica em `http://localhost:3000`.

O banco `aeig.db` é criado sozinho na primeira vez que o servidor sobe, já com as tabelas.

## Rotas

| Método | Rota | O que faz |
| --- | --- | --- |
| POST | /associados | Cadastra um associado |
| POST | /cobrancas | Gera a cobrança de um associado em um mês |
| GET | /cobrancas/:nosso_numero | Consulta uma cobrança |
| POST | /webhooks/pagamento | Recebe o aviso de pagamento do banco |

## Exemplos de chamadas

### 1. Cadastrar associado

```
curl -i -X POST http://localhost:3000/associados -H "Content-Type: application/json" -d '{"nome":"Maria Silva","cpf":"529.982.247-25","mensalidade":189.90}'
```

Resposta esperada: `201` com o associado cadastrado.

### 2. Gerar cobrança

```
curl -i -X POST http://localhost:3000/cobrancas -H "Content-Type: application/json" -d '{"associado_id":1,"mes_referencia":"2026-10"}'
```

Resposta esperada: `201` com a cobrança, status `PENDENTE` e nosso número `2026101`.

### 3. Consultar cobrança

```
curl -i http://localhost:3000/cobrancas/2026101
```

Resposta esperada: `200` com os dados da cobrança.

### 4. Aviso de pagamento

```
curl -i -X POST http://localhost:3000/webhooks/pagamento -H "Content-Type: application/json" -d '{"id_evento":"evt_000123","nosso_numero":"2026101","data_pagamento":"2026-10-15"}'
```

Resposta esperada: `200` com "Pagamento registrado.". Enviando o mesmo comando de novo, a resposta é `200` com "Evento já processado anteriormente.", e a cobrança não é processada duas vezes.

## Códigos de resposta

| Código | Quando acontece |
| --- | --- |
| 200 | Consulta ou aviso de pagamento processado |
| 201 | Associado ou cobrança criados |
| 400 | Dados inválidos (nome vazio, CPF inválido, mês fora do formato, data inválida) |
| 404 | Associado, cobrança ou nosso número não encontrados |
| 409 | CPF já cadastrado ou cobrança repetida no mesmo mês |
| 500 | Erro interno inesperado |

## Principais decisões

1. **SQLite como banco:** é simples de rodar, não precisa de servidor separado e é suficiente para o tamanho do teste.
2. **Dinheiro em centavos:** os valores chegam e saem em reais (189.90), mas ficam guardados no banco como número inteiro em centavos (18990), para evitar erros de arredondamento.
3. **CPF guardado só com números:** pode chegar com pontos e traço, mas é salvo sem eles, para a regra de não repetir funcionar.
4. **Regras de "não repete" no banco:** CPF único, nosso número único, uma cobrança por associado por mês e evento único são garantidos por restrições `UNIQUE` e `PRIMARY KEY` no banco, e não só no código.
5. **Nosso número:** é o mês sem o traço mais o id do associado (mês 2026-10 e associado 1 geram `2026101`). Nunca se repete, porque cada associado só pode ter uma cobrança por mês.
6. **Valor da cobrança guardado na própria cobrança:** se a mensalidade do associado mudar no futuro, as cobranças antigas continuam com o valor da época.
7. **Evento repetido responde 200:** o banco reenvia o aviso quando não recebe confirmação. Respondendo 200, ele entende que está tudo certo e para de reenviar.
8. **Pagamento processado em transação:** marcar a cobrança como paga e registrar o evento acontecem juntos. Se der erro no meio, nada fica salvo pela metade.
9. **Nosso número inexistente responde 404:** o evento não é registrado e o servidor continua funcionando.
10. **Aviso novo para cobrança já paga:** é aceito e registrado, mas não muda a data de pagamento original.

## O que ficou faltando

1. Os bônus não foram feitos: testes automatizados e validação da assinatura HMAC SHA256 no cabeçalho X-Assinatura.
2. A data de pagamento é validada só pelo formato, então uma data como 2026-02-31 passa.
3. Não existem rotas para listar, editar ou apagar associados e cobranças, porque o teste não pedia.

## Onde usei IA

Usei o Claude como mentor durante o projeto. Ele explicou os conceitos (Express, SQLite, validação de CPF, transação no banco). Eu digitei o código, testei cada rota com curl e escrevi os comentários com as minhas palavras para garantir que cada linha funciona