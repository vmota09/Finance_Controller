import { Hono } from 'hono'
import * as controller from "../controllers/dashboard"
import { requireAuth } from '../middleware/auth'

const route = new Hono()
route.use('*', requireAuth)

route.get('/resumo', controller.resumo)          
route.get('/categorias', controller.porCategoria) 
route.get('/mensal', controller.mensal)          // totais mês a mês
export { route }
