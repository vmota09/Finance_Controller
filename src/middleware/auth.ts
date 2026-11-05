import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

export type UsuarioLogado = { id: number, nome: string, email: string }

// Sessões em memória: uuid do cookie "ses" -> dados do usuário
// (somem quando o servidor reinicia, igual ao projeto de referência)
export const loggedUsers: Record<string, UsuarioLogado> = {}

export function getUsuarioLogado(c: Context): UsuarioLogado | undefined {
  const sesuuid = getCookie(c, "ses")
  if (!sesuuid) return undefined
  return loggedUsers[sesuuid]
}

// Bloqueia a rota se não houver usuário logado
export async function requireAuth(c: Context, next: Next) {
  const usuario = getUsuarioLogado(c)
  if (!usuario)
    return c.json({ msg: "usuário não logado" }, { status: 401 })
  c.set("usuario", usuario)
  return next()
}
