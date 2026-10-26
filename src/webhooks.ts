import { Router } from "express";
import db from "./db";

//Função que roda tudo junto no banco, se der erro no meio desfaz tudo
const processarPagamento = db.transaction(
  (idEvento: string, nossoNumero: string, dataPagamento: string) => {
    //Verifica se esse evento já foi processado antes
    const eventoJaProcessado = db
      .prepare("SELECT 1 FROM eventos_processados WHERE id_evento = ?")
      .get(idEvento);

    //Se o evento já existe para aqui e não processa de novo
    if (eventoJaProcessado) {
      return "evento_repetido";
    }

    //Busca a cobrança pelo nosso número e pega só o status
    const cobranca = db
      .prepare("SELECT status FROM cobrancas WHERE nosso_numero = ?")
      .get(nossoNumero) as { status: string } | undefined;

    //Se a cobrança não existe para aqui e não registra o evento
    if (!cobranca) {
      return "cobranca_inexistente";
    }

    //Só marca como PAGA se estava PENDENTE, assim não troca a data de quem já pagou
    if (cobranca.status === "PENDENTE") {
      db.prepare(
        "UPDATE cobrancas SET status = 'PAGA', data_pagamento = ? WHERE nosso_numero = ?"
      ).run(dataPagamento, nossoNumero);
    }

    //Registra o evento para reconhecer se o banco mandar ele de novo
    db.prepare("INSERT INTO eventos_processados (id_evento) VALUES (?)").run(idEvento);

    //Diz se pagou agora ou se a cobrança já estava paga
    return cobranca.status === "PENDENTE" ? "pago" : "ja_estava_paga";
  }
);

const router = Router();
//Aqui é criada uma rota POST para /webhooks/pagamento que recebe o aviso do banco
router.post("/webhooks/pagamento", (req, res) => {
  const { id_evento, nosso_numero, data_pagamento } = req.body ?? {};
  //Verifica se o id_evento não é texto ou está vazio (caso verdadeiro HTTP 400)
  if (typeof id_evento !== "string" || id_evento.trim() === "") {
    res.status(400).json({ erro: "O id_evento é obrigatório." });
    return;
  }
  //Verifica se o nosso_numero não é texto ou está vazio (caso verdadeiro HTTP 400)
  if (typeof nosso_numero !== "string" || nosso_numero.trim() === "") {
    res.status(400).json({ erro: "O nosso_numero é obrigatório." });
    return;
  }
  //Aqui verifica se a data está no formato AAAA-MM-DD, com mês de 01 a 12 e dia de 01 a 31
  if (
    typeof data_pagamento !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data_pagamento)
  ) {
    res.status(400).json({ erro: "A data_pagamento deve estar no formato AAAA-MM-DD." });
    return;
  }
  //Bloco que processa o pagamento e captura os erros sem cair o servidor
  try {
    const resultado = processarPagamento(id_evento, nosso_numero, data_pagamento);
    //Se não localizada a cobrança retorna HTTP 404
    if (resultado === "cobranca_inexistente") {
      res.status(404).json({ erro: "Cobrança não encontrada para esse nosso número." });
      return;
    }
    //Evento repetido responde HTTP 200 para o banco parar de reenviar
    if (resultado === "evento_repetido") {
      res.status(200).json({ mensagem: "Evento já processado anteriormente." });
      return;
    }
    //Aviso novo para cobrança que já estava paga também responde HTTP 200
    if (resultado === "ja_estava_paga") {
      res.status(200).json({ mensagem: "Cobrança já estava paga." });
      return;
    }
    //Caso tudo dê certo entrega HTTP 200
    res.status(200).json({ mensagem: "Pagamento registrado." });
  } catch (error) {
    //Qualquer outro erro que possa ocorrer vem código HTTP 500
    console.error(error);
    res.status(500).json({ erro: "Erro interno ao processar o pagamento." });
  }
});

export default router;