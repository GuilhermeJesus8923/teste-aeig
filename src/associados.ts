//Aqui trago as funções Router do express, o banco de dados e as funções do CPF
import { Router } from "express";
import db from "./db";
import { cpfValido, limparCpf } from "./cpf";

const router = Router();

//Registra uma rota com POST
router.post("/associados", (req, res) => {
    const { nome, cpf, mensalidade } = req.body ?? {};
  //Se o nome estiver vazio ou não for uma string erro 400 (pedido inválido)
    if (typeof nome !== "string" || nome.trim() === "") {
        res.status(400).json({ erro: "O nome é obrigatório." });
        return;
    }
  //Se o CPF não for string ou for falso (!) HTTP 400
    if (typeof cpf !== "string" || !cpfValido(cpf)) {
        res.status(400).json({ erro: "CPF inválido." });
        return;
    }
  //Verifica se a mensalidade é um número e se a mensalidade não é 0 ou menor
    if (typeof mensalidade !== "number" || !Number.isFinite(mensalidade) || mensalidade <= 0){
        res.status(400).json({ erro: "A mensalidade deve ser um número maior que zero." });
        return;
    }
    /* Aqui ele usa a função de limpar CPF, limpar o nome e converter a mensalidade para centavos */
    const cpfLimpo = limparCpf(cpf);
    const nomeLimpo = nome.trim();
    const mensalidadeCentavos = Math.round(mensalidade * 100);
    
    // Aqui os valores depois de conferidos são atribuidos aos seus respectivos espaços no banco de dados
    try {
      const resultado = db
        .prepare(
          "INSERT INTO associados (nome, cpf, mensalidade_centavos) VALUES (?, ?, ?)"
        )
        .run(nomeLimpo, cpfLimpo, mensalidadeCentavos); 
        // Retorna sucesso caso o preenchimento tenha ocorrido corretamente e volta o valor dos centavos
        res.status(201).json({
            id: Number(resultado.lastInsertRowid),
            nome: nomeLimpo,
            cpf: cpfLimpo,
            mensalidade: mensalidadeCentavos / 100,
        });
    } 
    //Erro caso o CPF já exista
    catch (error) {
      if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ erro: "Já existe um associado com esse CPF." });
        return;
      }
      //Qualquer outro erro que possa ocorrer gera este código 500
      console.error(error);
      res.status(500).json({ erro: "Erro interno ao cadastrar o associado." });
    }
});

export default router;