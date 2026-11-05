import { type } from 'arktype'
import type { Context, Next } from 'hono'

// Valida o corpo da requisição (+ parâmetros da URL) com um schema do arktype
export function ffInputType(schema: any) {
  return async function(c: Context, next: Next) {
    const body = await c.req.json().catch(() => null)
    if (!body)
      return c.json({ msg: "corpo JSON inválido" }, { status: 400 })
    const out = schema({
      ...body,
      ...c.req.param()
    })
    if (out instanceof type.errors)
      return c.json(out.summary, { status: 400 })
    return next()
  }
}
