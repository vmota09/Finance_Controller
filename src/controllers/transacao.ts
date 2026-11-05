import type { Context } from "hono"
import { db } from "../database-connect"
import type { UsuarioLogado } from "../middleware/auth"

const usuarioId = (c: Context) => (c.get("usuario") as UsuarioLogado).id

export const create = async (c: Context) => {
  const body = await c.req.json()
  const query = db.query(`
    INSERT INTO transacoes (usuario_id, tipo, descricao, valor, categoria, data)
    VALUES (:usuario_id, :tipo, :descricao, :valor, :categoria, :data)
  `)
  const resp = query.run({
    ":usuario_id": usuarioId(c),
    ":tipo": body.tipo,
    ":descricao": body.descricao,
    ":valor": body.valor,
    ":categoria": body.categoria ?? "outros",
    ":data": body.data,
  })
  return c.json({ id: resp.lastInsertRowid }, { status: 201 })
}

// Filtros opcionais: ?tipo=receita|despesa  ?mes=YYYY-MM
export const listAll = (c: Context) => {
  const tipo = c.req.query("tipo") ?? null
  const mes = c.req.query("mes") ?? null
  const query = db.query(`
    SELECT * FROM transacoes
    WHERE usuario_id=:usuario_id
      AND (:tipo IS NULL OR tipo=:tipo)
      AND (:mes  IS NULL OR substr(data, 1, 7)=:mes)
    ORDER BY data DESC, id DESC
  `)
  const data = query.all({ ":usuario_id": usuarioId(c), ":tipo": tipo, ":mes": mes })
  return c.json(data)
}

export const listOne = (c: Context) => {
  const query = db.query(`SELECT * FROM transacoes WHERE id=:id AND usuario_id=:usuario_id`)
  const data = query.get({ ":id": Number(c.req.param("id")), ":usuario_id": usuarioId(c) })
  if (!data)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  return c.json(data)
}

export const updateOne = async (c: Context) => {
  const body = await c.req.json()
  const query = db.query(`
    UPDATE transacoes
    SET tipo=:tipo, descricao=:descricao, valor=:valor, categoria=:categoria, data=:data
    WHERE id=:id AND usuario_id=:usuario_id
  `)
  const data = query.run({
    ":id": Number(c.req.param("id")),
    ":usuario_id": usuarioId(c),
    ":tipo": body.tipo,
    ":descricao": body.descricao,
    ":valor": body.valor,
    ":categoria": body.categoria ?? "outros",
    ":data": body.data,
  })
  if (data.changes === 0)
    return c.json({ msg: "não encontrado" }, { status: 404 })
  return c.json(data)
}

export const deleteOne = (c: Context) => {
  const query = db.query(`DELETE FROM transacoes WHERE id=:id AND usuario_id=:usuario_id`)
  const data = query.run({ ":id": Number(c.req.param("id")), ":usuario_id": usuarioId(c) })
  if (data.changes > 0)
    return c.body(null, 204)
  return c.json({ msg: "não encontrado" }, { status: 404 })
}
