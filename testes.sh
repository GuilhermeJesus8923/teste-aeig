#!/usr/bin/env bash

URL="http://localhost:3000"
JSON="Content-Type: application/json"

testar() {
  echo "### $1"
  echo "Esperado: $2"
  shift 2
  curl -s -w "\nRecebido: %{http_code}\n\n" "$@"
}

testar "1. Cadastrar associado" "201" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"Maria Silva","cpf":"529.982.247-25","mensalidade":189.90}'
testar "2. CPF repetido escrito sem pontos" "409" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"Outra Pessoa","cpf":"52998224725","mensalidade":100}'
testar "3. CPF com dígito errado" "400" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"Joao","cpf":"529.982.247-26","mensalidade":100}'
testar "4. CPF com dígitos repetidos" "400" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"Joao","cpf":"111.111.111-11","mensalidade":100}'
testar "5. Nome vazio" "400" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"","cpf":"529.982.247-25","mensalidade":100}'
testar "6. Mensalidade em texto" "400" -X POST "$URL/associados" -H "$JSON" -d '{"nome":"Joao","cpf":"529.982.247-25","mensalidade":"abc"}'

testar "7. Gerar cobrança" "201" -X POST "$URL/cobrancas" -H "$JSON" -d '{"associado_id":1,"mes_referencia":"2026-10"}'
testar "8. Cobrança repetida no mesmo mês" "409" -X POST "$URL/cobrancas" -H "$JSON" -d '{"associado_id":1,"mes_referencia":"2026-10"}'
testar "9. Mesmo associado em outro mês" "201" -X POST "$URL/cobrancas" -H "$JSON" -d '{"associado_id":1,"mes_referencia":"2026-11"}'
testar "10. Associado inexistente" "404" -X POST "$URL/cobrancas" -H "$JSON" -d '{"associado_id":99,"mes_referencia":"2026-10"}'
testar "11. Mês inválido" "400" -X POST "$URL/cobrancas" -H "$JSON" -d '{"associado_id":1,"mes_referencia":"2026-13"}'

testar "12. Consultar cobrança" "200 com status PENDENTE" "$URL/cobrancas/2026101"
testar "13. Consultar nosso número inexistente" "404" "$URL/cobrancas/999"

testar "14. Pagar cobrança" "200 Pagamento registrado" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000123","nosso_numero":"2026101","data_pagamento":"2026-10-15"}'
testar "15. Conferir se ficou paga" "200 com status PAGA e data 2026-10-15" "$URL/cobrancas/2026101"
testar "16. Mesmo evento de novo" "200 Evento já processado" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000123","nosso_numero":"2026101","data_pagamento":"2026-10-15"}'
testar "17. Evento novo para cobrança já paga" "200 Cobrança já estava paga" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000124","nosso_numero":"2026101","data_pagamento":"2026-10-20"}'
testar "18. Conferir que a data não mudou" "200 com data 2026-10-15" "$URL/cobrancas/2026101"
testar "19. Nosso número inexistente" "404" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000125","nosso_numero":"999","data_pagamento":"2026-10-15"}'
testar "20. Mesmo evento em cobrança que existe" "200 Pagamento registrado" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000125","nosso_numero":"2026111","data_pagamento":"2026-11-10"}'
testar "21. Data inválida" "400" -X POST "$URL/webhooks/pagamento" -H "$JSON" -d '{"id_evento":"evt_000126","nosso_numero":"2026101","data_pagamento":"2026-10-40"}'

testar "22. Servidor continua de pé" "200 ok" "$URL/saude"