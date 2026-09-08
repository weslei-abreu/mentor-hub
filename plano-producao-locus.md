# Plano de Execução — Locus (produtização completa)

> Este documento é a instrução única para o Claude Code rodar de ponta a ponta, sem parar pra pedir confirmação. Cole isso como prompt inicial no projeto local.

---

## 0. Modo de execução

Execute o plano inteiro de forma autônoma, do início ao fim, sem pausar para aprovação em nenhuma etapa — nem para criar estrutura de pastas, nem para instalar dependências, nem para rodar migrations/seeds. Para este projeto essa é a regra combinada, não uma exceção pontual. Ao final, apresente um resumo do que foi feito, o que ficou pendente (se algo não puder ser resolvido) e como rodar o projeto (comandos exatos).

Não instale pacotes fora dos listados neste documento sem necessidade real. Se precisar de algum pacote adicional para resolver algo específico, pode instalar, mas registre no resumo final o que foi e por quê.

---

## 1. Stack e padrões (obrigatório seguir)

- **Frontend:** React (Vite) + Tailwind CSS. Componentes próprios, sem lib de UI pronta tipo Flowbite — só inspiração visual.
- **Backend:** Node.js + Express + Knex (query builder puro, sem ORM completo).
- **Banco:** MySQL local. Host padrão, usuário `weslei`, sem senha. Criar o banco `mentor_db` se não existir.
- **Build do frontend:** SPA estático — `vite build` gerando `index.html` + `assets/` numa pasta `dist`, servida como arquivo estático pelo próprio Express (ou por Nginx depois, mas por enquanto Express serve o `dist`).
- **Autenticação:** JWT (access token + refresh token), senha com bcrypt, tabela de tokens de recuperação de senha.
- **IDs:** UUID (v4) em todas as tabelas, nunca auto-increment.
- **Segurança:** helmet, rate-limit básico nas rotas de auth, validação de payload em todas as rotas (ex: zod ou joi — escolher um e usar em todo o projeto, não misturar).

### Regras de código (seguir sempre)
1. Antes de criar qualquer função, componente ou service novo, verificar se já existe algo no projeto que resolva ou possa ser adaptado. Nunca duplicar lógica.
2. Não criar arquivos, dependências, abstrações ou funcionalidades além do que está descrito aqui.
3. Revisar cada arquivo gerado antes de finalizar, removendo código morto ou não usado.
4. Sem comentários óbvios. Comentar só regra de negócio não óbvia.
5. Sem emoji em nenhum lugar (código, commits, UI, mensagens).
6. Nomes de variável/função/arquivo/rota em inglês. Textos de interface em português.
7. Não inicializar git a menos que seja pedido.
8. Não criar README ou documentação extensa além do que este plano já pede.
9. Se um elemento visual (card, tabela, badge, modal de filtro) repete em mais de uma tela, virar componente reutilizável desde a primeira aparição.

---

## 2. Estrutura de pastas

A raiz do projeto é o frontend. Toda a API fica isolada numa pasta `/api` na raiz do projeto, ao lado do `src` do frontend — **a pasta `/api` e o arquivo `/api/.env` já foram criados manualmente**, com as credenciais de e-mail já preenchidas (ver item 6-A). Não recriar essa pasta do zero: usar a estrutura já existente dentro dela e completar o que faltar.

```
/ (raiz do projeto — frontend)
  /src
    /pages
    /components
    /components/filters   (componentes de filtro reutilizáveis)
    /services              (chamadas de API)
    /hooks
    /lib
    /store                 (contexto de auth/sessão)
  vite.config.ts
  package.json

/api
  /src
    /routes
    /controllers
    /services       (regra de negócio)
    /db
      /migrations
      /seeds
      knex.ts
    /middlewares     (auth, error handler, validate)
    /mail            (config e templates de e-mail)
    /utils
    app.ts
    server.ts
  .env
  .env.example
  package.json
```

Cada pasta (`/` e `/api`) tem seu próprio `package.json` e dependências independentes — não é monorepo com workspace, são dois projetos Node separados na mesma raiz de repositório.

---

## 3. Limpeza do codebase

- Remover toda a pasta `src/data` de mocks (`mock.ts`, dados hardcoded).
- Remover `src/lib/store.tsx` (estado local com localStorage) — substituir por chamadas reais de API + contexto de auth com JWT.
- Remover o Hub (`src/routes/index.tsx` com os 3 cards). A rota raiz (`/`) passa a ser a própria LP.
- Manter e reaproveitar: componentes de UI já feitos (cards, botões, tabelas, badges, gráficos com recharts), estrutura visual da LP, do painel do mentor e do aluno — só trocar a fonte de dados de mock para API real.
- Reaproveitar o roteador (TanStack Router) mas reorganizar rotas conforme item 5.

---

## 4. Banco de dados — schema (MySQL, migrations via Knex)

Todas as tabelas com `id CHAR(36)` (UUID), `created_at`, `updated_at`.

**users**
`id, name, email (unique), password_hash, role (admin | mentor | aluno), business, avatar, status (ativo|inativo), last_access`

**password_resets**
`id, user_id, token (unique), expires_at, used_at`

**refresh_tokens**
`id, user_id, token, expires_at, revoked_at`

**plans**
`id, name, price, period, monthly_equivalent, features (json), highlight (bool), active (bool)`

**subscriptions**
`id, user_id, plan_id, status (ativo|atrasado|cancelado), started_at, next_charge, amount`

**transactions**
`id, user_id, plan_id, amount, status (aprovado|recusado|pendente), method (cartao|pix|boleto), date`

**tags**
`id, name`

**companies** (empresas parceiras que produzem conteúdo)
`id, name, logo, description, field, link`

**videos**
`id, title, description, duration, published_at, company_id (fk), views, rating, ratings_count`

**video_tags** (N:N)
`video_id, tag_id`

**video_progress**
`id, user_id, video_id, progress (0-100), watched_at`

**posts**
`id, user_id, text, tag_id (nullable), video_id (nullable), likes_count`

**post_likes**
`id, post_id, user_id`

**comments**
`id, post_id, user_id, text`

**feedbacks**
`id, video_id, user_id, rating, comment`

**teia_contacts** (nós da teia)
`id, registered_by_id (fk users, o "principal" desse nó), name, company_name, field, city, phone, email, status (pendente|liberado — por solicitante, ver tabela abaixo)`

**teia_requests** (solicitações de apresentação)
`id, contact_id (fk teia_contacts), requested_by_id (fk users), status (pendente|aprovado|recusado), message, responded_at`

**lp_content** (layout builder da LP, controlado pelo admin)
`id, section_key (hero|beneficios|depoimentos|planos|faq|footer), content (json), order, active`

**lp_media**
`id, section_key, url, alt, order`

Migrations devem ser criadas uma por tabela, na ordem de dependência (users antes de subscriptions, etc). Seguir convenção de nome `NNNN_create_<table>.ts`.

---

## 5. Rotas de páginas (frontend)

**Públicas**
- `/` — LP (antiga `/lp`, agora é a home)
- `/login`
- `/recuperar-senha`
- `/redefinir-senha/:token`

**Aluno** (`/aluno/*`, protegido por role aluno)
- mantém as rotas já existentes: `index`, `biblioteca`, `video/:id`, `comunidade`, `empresas`, `empresa/:id`, `perfil`
- adicionar `/aluno/teia` (lista/kanban) e `/aluno/teia/mapa` (visão 3D)

**Mentor/Admin** (`/mentor/*` ou renomear para `/admin/*` — manter `/mentor/*` pra não quebrar tudo, mas adicionar sub-rotas novas)
- mantém: `index`, `alunos`, `aluno/:id`, `conteudo`, `comunidade`, `financeiro`
- adicionar `/mentor/lp` — editor da landing page (layout builder simplificado, ver item 7)
- adicionar `/mentor/teia` — visão administrativa da teia (todos os nós, todas as solicitações)
- adicionar `/mentor/usuarios` — CRUD de usuários (criar mentor/aluno, resetar senha manualmente, ativar/desativar)

**Checkout** — mantém `/checkout`, agora criando `transaction` e `subscription` reais via API em vez de mock.

---

## 6. Autenticação

- Login: email + senha → valida bcrypt → gera access token (JWT, expira em 15min) + refresh token (expira em 7 dias, salvo em `refresh_tokens`).
- Middleware de auth lê o token do header `Authorization: Bearer`, valida role por rota.
- Recuperar senha: gera token em `password_resets`, expira em 1h, envia e-mail com o link de redefinição (ver item 6-A).
- Redefinir senha: valida token não usado e não expirado, atualiza `password_hash`, marca `used_at`.

## 6-A. E-mail (SMTP real)

A pasta `/api` e o arquivo `/api/.env` **já existem**, criados manualmente com as credenciais reais preenchidas:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=wecod.solucoes@gmail.com
MAIL_PASSWORD=<já preenchida no .env existente>
MAIL_ENCRYPTION=tls
```

Não sobrescrever esse `.env` — ler as credenciais dele. Se o `.env` já tiver outras variáveis além dessas (banco, JWT secret etc.), preservá-las e só completar o que faltar, nunca substituir o arquivo inteiro.

- Criar `/api/.env.example` espelhando as chaves do `.env` real, mas com `MAIL_PASSWORD` e qualquer outro segredo em branco — é o `.env` que fica versionado como referência, nunca com valor real.
- Usar `nodemailer` para envio real de e-mail (recuperação de senha, e outros avisos que fizerem sentido depois). Criar módulo `/api/src/mail` com a configuração do transporte (host/port/secure conforme `MAIL_ENCRYPTION=tls` → `secure: false` com `requireTLS: true` na porta 587) e uma função `sendMail(to, subject, html)` reutilizável, lendo tudo do `.env` já existente.
- O fluxo de recuperar senha (item 6) envia e-mail de verdade com o link de redefinição, usando esse módulo. Se o envio falhar, logar o erro no console do servidor mas não quebrar a rota — retornar sucesso genérico pro frontend do mesmo jeito (não revelar se o e-mail existe ou não, e não vazar erro de infraestrutura pro usuário final).

---

Não precisa ser um builder visual de arrastar-e-soltar completo. O escopo realista:

- Tela `/mentor/lp` lista as seções da LP (`lp_content`): hero, benefícios, depoimentos, planos, faq, footer.
- Para cada seção, formulário editando os campos de texto daquele bloco (JSON schema fixo por seção — ex: hero tem `headline`, `subheadline`, `cta_text`; depoimentos é uma lista de `{nome, empresa, foto, frase}` editável, com adicionar/remover item).
- Upload de imagem por seção (salvar localmente em `/api/uploads` e servir estático, sem serviço de storage externo por enquanto).
- Botão "salvar" grava no banco (`lp_content`/`lp_media`); a LP pública (`/`) busca esse conteúdo via API em vez de ter texto fixo no componente.
- Reordenação simples de seção (campo `order`, com botões subir/descer — sem drag-and-drop se for complexo demais, priorizar funcionar).

---

## 8. Teia — as duas visualizações

**Regra de acesso:** todo usuário autenticado vê nome, ramo e cidade de qualquer nó. Telefone/email do contato só aparecem depois que `teia_requests` daquele contato para aquele usuário está com status `aprovado`.

**Lista/Kanban** (`/aluno/teia`)
- Colunas por ramo de atividade (ou toggle lista/kanban)
- Busca por nome/empresa/cidade
- Card com badge "contato liberado" ou botão "solicitar apresentação"
- Aba "minhas solicitações" (enviadas) e "solicitações recebidas" (pra contatos que eu cadastrei)

**Teia 3D** (`/aluno/teia/mapa`)
- Usar `react-force-graph-3d` (Three.js por baixo)
- Nó raiz = usuário logado; arestas saem para os contatos que ele cadastrou (`registered_by_id = me`); se um contato cadastrado por mim também é `registered_by_id` de outros contatos (ele mesmo virou "principal" ao cadastrar alguém), a ramificação continua a partir dele
- Clique no nó abre painel lateral com nome/ramo/cidade + botão "solicitar apresentação" (mesma ação da lista)
- Suporte a rotação, zoom, drag — comportamento padrão da lib, não precisa customizar física
- Endpoint de API retorna a árvore completa (ou a partir de um nó, com profundidade configurável) já no formato `{nodes, links}` que a lib espera

Endpoint sugerido: `GET /api/teia/graph?rootId=<userId opcional>` retornando nós e arestas prontos pro grafo.

---

## 9. Seeds

**Usuários**
- `admin@wecod.com.br` / `123456` — role `admin`
- `cliente1@wecod.com.br` / `123456` até `cliente8@wecod.com.br` / `123456` — role `aluno`, com `business`, `last_access` e `minutesWatched`/progress variados (reaproveitar a mesma lógica de variação que já existia no mock)
- 1 usuário role `mentor` além do admin, se fizer sentido separar admin de mentor (decidir: se `admin` já cobre tudo, não precisa duplicar role)

**Planos:** os 3 planos que já existiam no mock (mensal, trimestral, anual).

**Vídeos, tags, empresas parceiras:** reaproveitar os dados mockados existentes no `mock.ts` como seed inicial (mesmos textos, mesma variedade de tags).

**Teia:** seed com pelo menos 20-30 `teia_contacts` distribuídos entre os usuários `cliente*`, formando de fato ramificações (alguns contatos cadastrados por um cliente1 devem ter sido "expandidos" por outro usuário simulando que esse contato também é membro e cadastrou mais gente) — pra visualização 3D nascer com uma teia real e não uma estrela simples.

**LP:** seed de `lp_content` com os textos que já existiam na LP mockada (hero, benefícios, depoimentos, planos, faq).

---

## 10. Filtros — aplicar em toda tela de listagem

Cada página abaixo precisa dos filtros indicados, todos combináveis, com range de data customizado (início/fim) onde fizer sentido:

- **Mentor > Alunos:** status (ativo/inativo), busca por nome/empresa, range de data de cadastro, range de data de último acesso, ordenação por tempo assistido
- **Mentor > Conteúdo (vídeos):** tag/tema, empresa parceira, range de data de publicação, busca por título
- **Mentor > Comunidade:** tag, com/sem resposta, range de data do post
- **Mentor > Financeiro:** status do pagamento (aprovado/recusado/pendente), método (cartão/pix/boleto), plano, range de data da transação
- **Mentor > Usuários:** role, status, range de data de criação
- **Mentor > Teia (admin):** ramo de atividade, cidade, status da solicitação (pendente/aprovado/recusado), range de data da solicitação
- **Aluno > Biblioteca:** tag (multi-select), empresa, ordenação (recentes/mais assistidos/melhor avaliados), busca por título
- **Aluno > Teia (lista):** ramo, cidade, status (liberado/bloqueado), busca por nome/empresa

Implementar como componente reutilizável de barra de filtros (`/src/components/filters`), reaproveitado entre telas, com os filtros específicos de cada tela passados como config — não recriar o layout de filtro do zero em cada página.

Backend: cada endpoint de listagem aceita os filtros via query params e aplica no `knex` (`where`, `whereBetween` para ranges de data), com paginação.

---

## 11. Ordem de execução sugerida (para o Claude Code seguir)

1. Configurar `knex`, conexão com `mentor_db` (criar banco se não existir), criar todas as migrations do item 4 e rodar.
2. Criar seeds do item 9 e rodar.
3. Montar backend: middlewares de auth, rotas de autenticação (login, refresh, recuperar/redefinir senha), rotas de CRUD para cada entidade, rotas de filtro/listagem, rota de grafo da teia.
4. Limpar o frontend conforme item 3.
5. Criar telas de login, recuperar senha, redefinir senha.
6. Trocar toda fonte de dados mockada do frontend por chamadas reais de API (`/src/services`), mantendo os componentes visuais existentes sempre que possível.
7. Implementar o editor de LP no admin (item 7) e fazer a LP pública consumir esse conteúdo.
8. Implementar as duas visões da teia (item 8).
9. Implementar os filtros em todas as telas listadas (item 10).
10. Rodar `vite build` no client, validar que o `dist/index.html` sobe corretamente servido pelo Express.
11. Testar o fluxo completo: login como admin, editar LP, ver LP pública atualizada, login como cliente, navegar biblioteca com filtros, assistir vídeo, avaliar, ver teia em lista e em 3D, solicitar apresentação, aprovar como o dono do contato, checkout gerando transaction real.

---

## 12. Comandos esperados ao final

Deixar documentado no resumo final (não precisa ser um README, só no texto de resposta):
- Como rodar as migrations e seeds do zero
- Como subir a API e como subir/servir o frontend
- As credenciais de teste (admin e clientes)
