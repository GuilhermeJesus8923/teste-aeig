//Criação do banco de dados através do better-sqlite3
import Database from "better-sqlite3";
const db: Database.Database = new Database("aeig.db");

db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS associados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    mensalidade_centavos INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cobrancas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    associado_id INTEGER NOT NULL REFERENCES associados(id),
    mes_referencia TEXT NOT NULL,
    valor_centavos INTEGER NOT NULL,
    nosso_numero TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    data_pagamento TEXT,
    UNIQUE (associado_id, mes_referencia)
  );

  CREATE TABLE IF NOT EXISTS eventos_processados (
    id_evento TEXT PRIMARY KEY
  );
`);
export default db;