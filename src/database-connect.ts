import { Database } from "bun:sqlite"

const db = new Database("database.sqlite")
db.run("PRAGMA foreign_keys = ON;")

db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT NOT NULL,
    idade          INTEGER,
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS transacoes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao   TEXT NOT NULL,
    valor       REAL NOT NULL CHECK (valor > 0),
    categoria   TEXT NOT NULL DEFAULT 'outros',
    data        TEXT NOT NULL  -- formato YYYY-MM-DD
  );
`);

export { db }
