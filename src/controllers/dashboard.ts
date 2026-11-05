import type { Context } from "hono"
import { db } from "../database-connect"
import type { UsuarioLogado } from "../middleware/auth"

const usuarioId = (c: Context) => (c.get("usuario") as UsuarioLogado).id

// Total de receitas, despesas e saldo (?mes=YYYY-MM opcional)
export const resumo = (c: Context) => {
  const query = db.query(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo='receita' THEN valor END), 0) AS receitas,
      COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor END), 0) AS despesas,
      COUNT(*) AS quantidade
    FROM transacoes
    WHERE usuario_id=:usuario_id
      AND (:mes IS NULL OR substr(data, 1, 7)=:mes)
  `)
  const data: any = query.get({ ":usuario_id": usuarioId(c), ":mes": c.req.query("mes") ?? null })
  return c.json({ ...data, saldo: data.receitas - data.despesas })
}

// Totais agrupados por tipo e categoria (?mes=YYYY-MM opcional)
export const porCategoria = (c: Context) => {
  const query = db.query(`
    SELECT tipo, categoria, SUM(valor) AS total
    FROM transacoes
    WHERE usuario_id=:usuario_id
      AND (:mes IS NULL OR substr(data, 1, 7)=:mes)
    GROUP BY tipo, categoria
    ORDER BY total DESC
  `)
  return c.json(query.all({ ":usuario_id": usuarioId(c), ":mes": c.req.query("mes") ?? null }))
}

// Receitas x despesas mês a mês
export const mensal = (c: Context) => {
  const query = db.query(`
    SELECT
      substr(data, 1, 7) AS mes,
      COALESCE(SUM(CASE WHEN tipo='receita' THEN valor END), 0) AS receitas,
      COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor END), 0) AS despesas
    FROM transacoes
    WHERE usuario_id=:usuario_id
    GROUP BY mes
    ORDER BY mes
  `)
  const data: any[] = query.all({ ":usuario_id": usuarioId(c) })
  return c.json(data.map(m => ({ ...m, saldo: m.receitas - m.despesas })))
}
