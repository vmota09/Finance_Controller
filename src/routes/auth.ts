import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { db } from "../database-connect"
import { loggedUsers, getUsuarioLogado, criarSessao, SESSAO_HORAS } from '../middleware/auth'

const route = new Hono()

// LOGIN
route.post("/login", async (c) => {
  const body = await c.req.json()
  const query = db.query(`
    SELECT id, email, nome, password_hash FROM usuarios
    WHERE email=:email
    LIMIT 1
  `)
  const data: any = query.get({ ":email": body.email })
  if (!data)
    return c.json({ msg: "usuário não encontrado" }, { status: 404 })
  const isMatch = await Bun.password.verify(body.password, data.password_hash)
  if (!isMatch)
    return c.json({ msg: "senha inválida" }, { status: 401 })
  delete data.password_hash
  const uuid = criarSessao(data)
  setCookie(c, "ses", uuid, {
    httpOnly: true, path: "/", sameSite: "Lax",
    maxAge: SESSAO_HORAS * 60 * 60,   // em segundos
  })
  return c.json(true)
})

// LOGOUT
route.post("/logout", (c) => {
  const sesuuid = getCookie(c, "ses")
  if (sesuuid) delete loggedUsers[sesuuid]
  deleteCookie(c, "ses", { path: "/" })
  return c.json(true)
})

// USUÁRIO LOGADO
route.get("/user", (c) => {
  const data = getUsuarioLogado(c)
  if (!data)
    return c.json({ msg: "usuário não logado" }, { status: 401 })
  return c.json(data)
})

export { route }
