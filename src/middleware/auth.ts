import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

export type UsuarioLogado = { id: number, nome: string, email: string }

// Quanto tempo uma sessão vale (o cookie usa o mesmo prazo)
export const SESSAO_HORAS = 8

// (somem quando o servidor reinicia)
// uuid do cookie "ses" -> usuário + momento em que a sessão expira
export const loggedUsers: Record<string, { usuario: UsuarioLogado, expira: number }> = {}

export function criarSessao(usuario: UsuarioLogado): string {
  const uuid = crypto.randomUUID()
  loggedUsers[uuid] = { usuario, expira: Date.now() + SESSAO_HORAS * 60 * 60 * 1000 }
  return uuid
}

export function getUsuarioLogado(c: Context): UsuarioLogado | undefined {
  const sesuuid = getCookie(c, "ses")
  if (!sesuuid) return undefined
  const sessao = loggedUsers[sesuuid]
  if (!sessao) return undefined
  if (sessao.expira < Date.now()) {   // venceu: apaga e trata como deslogado
    delete loggedUsers[sesuuid]
    return undefined
  }
  return sessao.usuario
}

// Atualiza nome/email em todas as sessões do usuário (depois de editar o perfil)
export function atualizarSessoes(id: number, dados: Partial<UsuarioLogado>) {
  for (const sessao of Object.values(loggedUsers))
    if (sessao.usuario.id === id) Object.assign(sessao.usuario, dados)
}

// Encerra todas as sessões do usuário (depois de excluir a conta)
export function encerrarSessoes(id: number) {
  for (const [uuid, sessao] of Object.entries(loggedUsers))
    if (sessao.usuario.id === id) delete loggedUsers[uuid]
}

// Bloqueia a rota se não houver usuário logado
export async function requireAuth(c: Context, next: Next) {
  const usuario = getUsuarioLogado(c)
  if (!usuario)
    return c.json({ msg: "usuário não logado" }, { status: 401 })
  c.set("usuario", usuario)
  return next()
}

// Só deixa passar se o :id da URL for o do próprio usuário logado
// (usar depois do requireAuth)
export async function somenteProprio(c: Context, next: Next) {
  const usuario = c.get("usuario") as UsuarioLogado
  if (Number(c.req.param("id")) !== usuario.id)
    return c.json({ msg: "sem permissão para acessar outro usuário" }, { status: 403 })
  return next()
}
