import { Hono } from 'hono'
import * as controller from "../controllers/dashboard"
import { requireAuth } from '../middleware/auth'

const route = new Hono()
route.use('*', requireAuth)

route.get('/resumo', controller.resumo)          // ?mes=YYYY-MM (opcional)
route.get('/categorias', controller.porCategoria) // ?mes=YYYY-MM (opcional)
route.get('/mensal', controller.mensal)          // totais mês a mês
export { route }
