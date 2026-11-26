import { Hono } from 'hono'
import * as controller from "../controllers/usuario"
import { type } from 'arktype'
import { ffInputType } from '../middleware/inputTest'
import { requireAuth, somenteProprio } from '../middleware/auth'

const protoSchema: any = {
  nome: "0 < string <= 80",
  idade: "0 <= number.integer <= 130",
  email: "string.email",
  password: "string >= 6"
}
const User = type(protoSchema)
// na edição a senha é opcional (só troca se vier preenchida)
const { password, ...semSenha } = protoSchema
// para trocar a senha é preciso mandar também a senha atual (senhaAtual)
const UserId = type({ ...semSenha, "password?": "string >= 6", "senhaAtual?": "string", id: "string.numeric" })

const route = new Hono()
route.post('/usuario', ffInputType(User), controller.create)   // cadastro: aberto
// cada usuário só vê, edita e exclui a própria conta
route.get('/usuario/:id', requireAuth, somenteProprio, controller.listOne)
route.delete('/usuario/:id', requireAuth, somenteProprio, controller.deleteOne)
route.put('/usuario/:id', requireAuth, somenteProprio, ffInputType(UserId), controller.updateOne)
export { route }
