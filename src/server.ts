import index from "../public/index.html"
import dashboard from "../public/dashboard.html"

import { routes } from './routes'
import { Hono } from 'hono'

const app = new Hono()
app.route("/", routes)

const srv = Bun.serve({
  port: 3000,
  routes: {
    "/": index,                 // login / cadastro
    "/dashboard": dashboard,    // painel do usuário logado
  },
  fetch: app.fetch,
})

console.log(`Server is running on ${srv.url}`)
