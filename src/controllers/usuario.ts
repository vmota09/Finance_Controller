import type { Context } from "hono"
import { db } from "../database-connect"

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

export const deleteOne = (c: Context) => {
  const data = db.query(`DELETE FROM usuarios WHERE id=:id`).run({ ":id": Number(c.req.param("id")) })
  if (data.changes > 0)
    return c.body(null, 204)
  return c.json({ msg: "não encontrado" }, { status: 404 })
}

export const updateOne = async (c: Context) => {
  const body = await c.req.json()
  const query = db.query(`UPDATE usuarios SET idade=:idade, nome=:nome, email=:email WHERE id=:id`)
  const data = query.run({
    ":id": Number(c.req.param("id")),
    ":nome": body.nome,
    ":idade": body.idade,
    ":email": body.email,
  })
  if (data.changes === 0)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  return c.json(data)
}
