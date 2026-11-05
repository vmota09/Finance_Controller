import { route as usuario } from './usuario'
import { route as auth } from './auth'
import { route as transacao } from './transacao'
import { route as dashboard } from './dashboard'
import { Hono } from 'hono'

const routes = new Hono()
routes.route("/", usuario)
routes.route("/auth", auth)
routes.route("/transacao", transacao)
routes.route("/dashboard", dashboard)
export { routes }
