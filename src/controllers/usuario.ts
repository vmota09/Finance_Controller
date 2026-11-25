import type { Context } from "hono"
import { deleteCookie } from "hono/cookie"
import { db } from "../database-connect"
import { atualizarSessoes, encerrarSessoes } from "../middleware/auth"

// Colunas públicas (nunca devolver password_hash)
const COLS = "id, nome, idade, email"

export const create = async (c: Context) => {
  const body = await c.req.json()
  const existe = db.query(`SELECT id FROM usuarios WHERE email=:email`).get({ ":email": body.email })
  if (existe)
    return c.json({ msg: "email já cadastrado" }, { status: 409 })
  const query = db.query(`
    INSERT INTO usuarios (nome, idade, email, password_hash)
    VALUES (:nome, :idade, :email, :password_hash)
  `)
  const resp = query.run({
    ":nome": body.nome,
    ":idade": body.idade,
    ":email": body.email,
    ":password_hash": await Bun.password.hash(body.password)
  })
  return c.json({ id: resp.lastInsertRowid }, { status: 201 })
}

export const listAll = (c: Context) => {
  const data = db.query(`SELECT ${COLS} FROM usuarios`).all()
  return c.json(data)
}

export const listOne = (c: Context) => {
  const data = db.query(`SELECT ${COLS} FROM usuarios WHERE id=:id`).get({ ":id": Number(c.req.param("id")) })
  if (!data)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  return c.json(data)
}

// Exclui a conta (as transações vão junto, pelo ON DELETE CASCADE) e desloga
export const deleteOne = (c: Context) => {
  const id = Number(c.req.param("id"))
  const data = db.query(`DELETE FROM usuarios WHERE id=:id`).run({ ":id": id })
  if (data.changes === 0)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  encerrarSessoes(id)
  deleteCookie(c, "ses", { path: "/" })
  return c.body(null, 204)
}

export const updateOne = async (c: Context) => {
  const id = Number(c.req.param("id"))
  const body = await c.req.json()
  // o novo email não pode ser de outra pessoa
  const outro = db.query(`SELECT id FROM usuarios WHERE email=:email AND id<>:id`).get({ ":email": body.email, ":id": id })
  if (outro)
    return c.json({ msg: "email já cadastrado" }, { status: 409 })
  const query = db.query(`UPDATE usuarios SET idade=:idade, nome=:nome, email=:email WHERE id=:id`)
  const data = query.run({
    ":id": id,
    ":nome": body.nome,
    ":idade": body.idade,
    ":email": body.email,
  })
  if (data.changes === 0)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  // senha só muda se vier no corpo
  if (body.password) {
    db.query(`UPDATE usuarios SET password_hash=:hash WHERE id=:id`)
      .run({ ":id": id, ":hash": await Bun.password.hash(body.password) })
  }
  atualizarSessoes(id, { nome: body.nome, email: body.email })
  return c.json(db.query(`SELECT ${COLS} FROM usuarios WHERE id=:id`).get({ ":id": id }))
}
