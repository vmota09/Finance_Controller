import { Hono } from 'hono'
import * as controller from "../controllers/transacao"
import { type } from 'arktype'
import { ffInputType } from '../middleware/inputTest'
import { requireAuth } from '../middleware/auth'

const protoSchema: any = {
  tipo: "'receita' | 'despesa'",
  descricao: "string > 0",
  valor: "number > 0",
  "categoria?": "string",
  data: /^\d{4}-\d{2}-\d{2}$/,   // YYYY-MM-DD
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
