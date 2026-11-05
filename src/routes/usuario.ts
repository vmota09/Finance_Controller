import { Hono } from 'hono'
import * as controller from "../controllers/usuario"
import { type } from 'arktype'
import { ffInputType } from '../middleware/inputTest'

const protoSchema: any = {
  nome: "string",
  idade: "number",
  email: "string.email",
  password: "string >= 6"
}
const User = type(protoSchema)
const UserId = type({ nome: "string", idade: "number", email: "string.email", id: "string.numeric" })

const route = new Hono()
route.get('/usuario', controller.listAll)
route.post('/usuario', ffInputType(User), controller.create)
route.get('/usuario/:id', controller.listOne)
route.delete('/usuario/:id', controller.deleteOne)
route.put('/usuario/:id', ffInputType(UserId), controller.updateOne)
export { route }
