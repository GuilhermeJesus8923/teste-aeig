import { Router } from "express";
import db from "./db";

//Descreve um linha da tabela cobrança
type CobrancaLinha = {
  associado_id: number;
  mes_referencia: string;
  valor_centavos: number;
  nosso_numero: string;
  status: string;
  data_pagamento: string | null; // Aceita texto ou vazio
};
/*Função que recebe a linha da tabela de cobrança no formato do molde*/
function formatarCobranca(cobranca: CobrancaLinha) {
  //Devolve o novo objeto para a API que irá mostrar
  return {
    nosso_numero: cobranca.nosso_numero,
    associado_id: cobranca.associado_id,
    mes_referencia: cobranca.mes_referencia,
    valor: cobranca.valor_centavos / 100,
    status: cobranca.status,
    data_pagamento: cobranca.data_pagamento,
  };
}

const router = Router();
//Aqui é criada uma rota POST para /cobrancas
router.post("/cobrancas", (req, res) => {
  const { associado_id, mes_referencia } = req.body ?? {};
  //Verifica se o número não é um integer ou se é menor/igual a zero(caso verdadeiro HTTP 400)
  if (!Number.isInteger(associado_id) || associado_id <= 0) {
    res.status(400).json({ erro: "O associado_id deve ser um número inteiro positivo." });
    return;
  }
  //Aqui verifica se o mês e ano estão no formato AAAA-MM e se o mês vai de 01 a 12
  if (
    typeof mes_referencia !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes_referencia)
  ) 
  {
    res.status(400).json({ erro: "O formato data AAAA-MM." });
    return;
  }
  //Busca o associado pelo id junto com o valor da mensalidade dele
  const associado = db
    .prepare("SELECT id, mensalidade_centavos FROM associados WHERE id = ?")
    .get(associado_id) as { id: number; mensalidade_centavos: number } | undefined;
  //Se ninguém for encontrado
  if (!associado) {
    res.status(404).json({ erro: "Associado não encontrado." });
    return;
  }
  //Tira o traço da data e junta com o id do associado para criar o nosso número
  const nossoNumero = mes_referencia.replace("-", "") + associado.id;
  
  //Bloco que adiciona valores dentro da tabela cobranças e captura os erros sem cair o servidor
  try {
    db.prepare(
      "INSERT INTO cobrancas (associado_id, mes_referencia, valor_centavos, nosso_numero) VALUES (?, ?, ?, ?)")
      .run(associado.id, mes_referencia, associado.mensalidade_centavos, nossoNumero);
  } 
  // Indica erro caso o associado já tenha uma cobrança no mesmo mês na tabela de cobranças
  catch (error) {
    if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ erro: "Já existe uma cobrança desse associado nesse mês." });
      return;
    }
    //Qualquer outro erro que possa ocorrer vem código HTTP 500
    console.error(error);
    res.status(500).json({ erro: "Erro interno ao gerar a cobrança." });
    return;
  }

  const cobranca = db
    .prepare("SELECT * FROM cobrancas WHERE nosso_numero = ?")
    .get(nossoNumero) as CobrancaLinha;
  //Caso todos deem certo entrega HTTP 201
  res.status(201).json(formatarCobranca(cobranca));
});
//Registra a rota GET e busca no banco o nosso número enviado
router.get("/cobrancas/:nosso_numero", (req, res) => {
  const cobranca = db
    .prepare("SELECT * FROM cobrancas WHERE nosso_numero = ?")
    .get(req.params.nosso_numero) as CobrancaLinha | undefined;
  //Se não localizada a cobranca retorna HTTP 404
  if (!cobranca) {
    res.status(404).json({ erro: "Cobrança não encontrada." });
    return;
  }
  //Converte o valor para reais e entrega em JSON
  res.json(formatarCobranca(cobranca));
});

export default router;