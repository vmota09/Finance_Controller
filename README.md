# Finance Controller

Sistema básico de controle financeiro pessoal: cadastro e login, lançamento de receitas e despesas, dashboard com resumo, gráfico mês a mês e totais por categoria.

Estrutura baseada no projeto de exemplo da disciplina ([prfdnl/2026-bsi24-webdev2](https://github.com/prfdnl/2026-bsi24-webdev2)).

## Tecnologias

- [Bun](https://bun.com): runtime, servidor HTTP e banco SQLite (`bun:sqlite`)
- [Hono](https://hono.dev): rotas da API
- [arktype](https://arktype.io): validação dos dados recebidos
- HTML + CSS + JavaScript puro no front (sem framework)

## Como rodar

```bash
bun install
bun run index.ts
```

Abra http://localhost:3000. O banco (`database.sqlite`) é criado sozinho na primeira execução.

## Estrutura

```
index.ts                     → só importa src/server
src/
  server.ts                  → Bun.serve: páginas HTML + API (Hono)
  database-connect.ts        → conexão SQLite e criação das tabelas
  routes/                    → define os caminhos da API e quais middlewares usam
  controllers/               → lógica de cada rota (SQL)
  middleware/
    inputTest.ts             → valida o corpo da requisição com arktype
    auth.ts                  → sessões, requireAuth e somenteProprio
public/
  index.html                 → login / cadastro
  dashboard.html             → resumo, lançamentos, gráfico, categorias
  perfil.html                → minha conta (dados, senha, excluir conta)
  style.css                  → estilo compartilhado (tema claro e escuro)
```

## Páginas

| Caminho      | Página                         |
|--------------|--------------------------------|
| `/`          | login e cadastro               |
| `/dashboard` | painel do usuário logado       |
| `/perfil`    | minha conta                    |

## API

🔒 = precisa estar logado (cookie `ses`).

### Autenticação
| Método | Rota           | O que faz                          |
|--------|----------------|------------------------------------|
| POST   | `/auth/login`  | entra (`email`, `password`)        |
| POST   | `/auth/logout` | sai                                |
| GET    | `/auth/user`   | dados do usuário logado            |

### Usuário
| Método | Rota            | O que faz                                            |
|--------|-----------------|------------------------------------------------------|
| POST   | `/usuario`      | cadastro (`nome`, `idade`, `email`, `password`)      |
| GET    | `/usuario`      | 🔒 lista usuários                                     |
| GET    | `/usuario/:id`  | 🔒 dados da própria conta                             |
| PUT    | `/usuario/:id`  | 🔒 edita a própria conta (`password` opcional)        |
| DELETE | `/usuario/:id`  | 🔒 exclui a própria conta e as transações dela        |

Nas rotas com `:id`, só é permitido acessar a própria conta (outro id → 403).

### Transações 🔒
| Método | Rota              | O que faz                                                  |
|--------|-------------------|------------------------------------------------------------|
| GET    | `/transacao`      | lista as do usuário (filtros: `?tipo=receita\|despesa`, `?mes=AAAA-MM`) |
| POST   | `/transacao`      | cria (`tipo`, `descricao`, `valor`, `categoria`, `data`)   |
| GET    | `/transacao/:id`  | uma transação                                              |
| PUT    | `/transacao/:id`  | edita                                                      |
| DELETE | `/transacao/:id`  | exclui                                                     |

### Dashboard 🔒
| Método | Rota                     | O que faz                                        |
|--------|--------------------------|--------------------------------------------------|
| GET    | `/dashboard/resumo`      | receitas, despesas e saldo (`?mes=AAAA-MM`)      |
| GET    | `/dashboard/categorias`  | totais por tipo e categoria (`?mes=AAAA-MM`)     |
| GET    | `/dashboard/mensal`      | receitas, despesas e saldo de cada mês           |

## Observações

- As sessões ficam em memória (como no projeto de exemplo) e valem 8 horas. Se o servidor reiniciar, é preciso entrar de novo.
- Os valores são guardados com no máximo 2 casas decimais.
