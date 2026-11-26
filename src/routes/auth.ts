import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { type } from 'arktype'
import { db } from "../database-connect"
import { loggedUsers, getUsuarioLogado, criarSessao, encerrarSessoes, SESSAO_HORAS } from '../middleware/auth'
import { ffInputType } from '../middleware/inputTest'
import { enviarEmail } from '../email'

const route = new Hono()

// Quanto tempo o link de recuperação de senha vale
const RECUPERACAO_MINUTOS = 30

// Códigos de recuperação pendentes (em memória, como as sessões)
// código -> id do usuário + momento em que expira
const codigosRecuperacao: Record<string, { usuarioId: number, expira: number }> = {}

// hash de uma senha qualquer, usado no login quando o email não existe
const HASH_FALSO = await Bun.password.hash(crypto.randomUUID())

const EsqueciSenha = type({ email: "string.email" })
const RedefinirSenha = type({ codigo: "string", password: "string >= 6" })

// LOGIN
route.post("/login", async (c) => {
  const body = await c.req.json()
  const query = db.query(`
    SELECT id, email, nome, password_hash FROM usuarios
    WHERE email=:email
    LIMIT 1
  `)
  const data: any = query.get({ ":email": body.email })
  // Mesma resposta para "email não existe" e "senha errada":
  // assim o login não revela quais emails têm conta.
  // (se o email não existe, confere contra um hash qualquer para a resposta demorar o mesmo tempo)
  const hash = data?.password_hash ?? HASH_FALSO
  const isMatch = await Bun.password.verify(body.password, hash)
  if (!data || !isMatch)
    return c.json({ msg: "email ou senha inválidos" }, { status: 401 })
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

// ESQUECI A SENHA: gera um código e "envia" o link de recuperação por email
route.post("/esqueci-senha", ffInputType(EsqueciSenha), async (c) => {
  const body = await c.req.json()
  const usuario: any = db.query(`SELECT id, email FROM usuarios WHERE email=:email`).get({ ":email": body.email })

  if (usuario) {
    // invalida códigos antigos desse usuário: só o último link funciona
    for (const [codigo, pedido] of Object.entries(codigosRecuperacao))
      if (pedido.usuarioId === usuario.id) delete codigosRecuperacao[codigo]

    const codigo = crypto.randomUUID()
    codigosRecuperacao[codigo] = { usuarioId: usuario.id, expira: Date.now() + RECUPERACAO_MINUTOS * 60 * 1000 }
    const link = new URL(`/redefinir-senha?codigo=${codigo}`, c.req.url).href

    // Este projeto não tem servidor de email: o "email" é mostrado no terminal do servidor.
    // Num sistema real, aqui entraria o envio do email com o link.
    await enviarEmail(usuario.email, "Recuperação de senha", `Redefina sua senha em: ${link}\n(vale 30 minutos)`)
  }

  // A resposta é a mesma existindo ou não o email, para não revelar quem tem conta
  return c.json({ msg: "Se o email estiver cadastrado, enviamos um link de recuperação." })
})

// REDEFINIR A SENHA: recebe o código do link + a nova senha
route.post("/redefinir-senha", ffInputType(RedefinirSenha), async (c) => {
  const body = await c.req.json()
  const pedido = codigosRecuperacao[body.codigo]
  if (!pedido || pedido.expira < Date.now()) {
    delete codigosRecuperacao[body.codigo]
    return c.json({ msg: "link inválido ou expirado" }, { status: 400 })
  }

  const hash = await Bun.password.hash(body.password)
  db.query(`UPDATE usuarios SET password_hash=:hash WHERE id=:id`).run({ ":hash": hash, ":id": pedido.usuarioId })

  delete codigosRecuperacao[body.codigo]   // o link só pode ser usado uma vez
  encerrarSessoes(pedido.usuarioId)          // desloga quem estiver usando a senha antiga
  return c.json(true)
})

export { route }
