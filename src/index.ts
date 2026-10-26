//Importa o express e as rotas dentro de associados
import express from "express";
import associadosRouter from "./associados";
import cobrancasRouter from "./cobrancas";
import webhooksRouter from "./webhooks";

const app = express();

//Lê tudo que recebe em JSON e entrega pronto em req.body
app.use(express.json());
//Pluga no servidor todas as rotas que estão dentro de router
app.use(associadosRouter);
app.use(cobrancasRouter);
app.use(webhooksRouter);

app.get("/saude", (req, res) => {
  res.send("ok");
});

app.get("/ola", (req, res) => {
  res.send("olá, AEIG");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});