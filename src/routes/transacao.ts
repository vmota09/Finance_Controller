import { Hono } from 'hono'
import * as controller from "../controllers/transacao"
import { type } from 'arktype'
import { ffInputType } from '../middleware/inputTest'
import { requireAuth } from '../middleware/auth'

// YYYY-MM-DD e que seja uma data que existe (recusa 2026-02-30, por exemplo)
const DataISO = type(/^\d{4}-\d{2}-\d{2}$/).narrow((s, ctx) => {
  const d = new Date(s + "T00:00:00Z")
  return (!isNaN(d.getTime()) && d.toISOString().startsWith(s)) || ctx.mustBe("uma data válida (AAAA-MM-DD)")
})

const protoSchema: any = {
  tipo: "'receita' | 'despesa'",
  descricao: "0 < string <= 100",
  valor: "0 < number <= 1000000000",
  "categoria?": "0 < string <= 30",
  data: DataISO,
}
const Transacao = type(protoSchema)
const TransacaoId = type({ ...protoSchema, id: "string.numeric" })

const route = new Hono()
route.use('*', requireAuth)   // todas as rotas de transação exigem login

route.get('/', controller.listAll)            // ?tipo=receita|despesa  ?mes=YYYY-MM
route.post('/', ffInputType(Transacao), controller.create)
route.get('/:id', controller.listOne)
route.put('/:id', ffInputType(TransacaoId), controller.updateOne)
route.delete('/:id', controller.deleteOne)
export { route }
