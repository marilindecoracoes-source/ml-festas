# ML Festas — Sistema de Gestão

Sistema completo de gestão para a ML Festas (locação e venda de artigos para festas).

## Funcionalidades

- **Dashboard** com faturamento, pedidos em aberto, locações em atraso e próximas entregas
- **CRM de Clientes** com histórico, documentos e busca por nome/CPF/e-mail
- **Encomendas** com Kanban drag-and-drop (Pedido → Em Produção → Pronto → Material Retirado)
- **Locações** com Kanban e alertas de atraso de devolução
- **Calendário** com entregas, retiradas, devoluções e aniversários
- **Consulta Pública** sem login — cliente verifica status pelo CPF
- Autenticação via Supabase Auth (apenas o admin)

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (para deploy)

---

## 1. Instalação local

```bash
# Clone ou baixe o projeto
cd ml-festas

# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env.local
```

---

## 2. Configuração do Supabase

### 2.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL do projeto** e as **chaves de API**

### 2.2 Criar as tabelas

1. No painel do Supabase, vá em **SQL Editor**
2. Cole o conteúdo do arquivo `supabase-schema.sql` e execute

### 2.3 Criar o usuário admin

1. No Supabase, vá em **Authentication → Users**
2. Clique em **Add user** e crie o usuário com e-mail e senha

### 2.4 Configurar variáveis de ambiente

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

As chaves estão em: **Supabase → Project Settings → API**

---

## 3. Rodar localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

- **Painel admin:** `http://localhost:3000/login`
- **Consulta pública:** `http://localhost:3000/consulta`

---

## 4. Logo da marca

Coloque o arquivo de logo em `public/logo.png` (ou `.jpg`).

Para usá-lo na sidebar e login, substitua o bloco `<div>ML</div>` por:

```tsx
<img src="/logo.png" alt="ML Festas" className="h-10 w-auto" />
```

---

## 5. Deploy na Vercel

### 5.1 Via interface web (recomendado)

1. Faça push do projeto para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project**
3. Importe o repositório
4. Em **Environment Variables**, adicione as 4 variáveis do `.env.local`
5. Clique em **Deploy**

### 5.2 Via CLI

```bash
npm install -g vercel
vercel --prod
```

### 5.3 Após o deploy

Atualize `NEXT_PUBLIC_APP_URL` para a URL da Vercel:

```env
NEXT_PUBLIC_APP_URL=https://ml-festas.vercel.app
```

---

## 6. Domínio customizado (Hostinger ou outro)

1. Na Vercel, vá em **Project Settings → Domains**
2. Adicione seu domínio (ex: `sistema.mlfestas.com.br`)
3. No painel da Hostinger (ou outro registrador), adicione um registro DNS:
   - **Tipo:** CNAME
   - **Nome:** `sistema` (ou `@` para domínio raiz)
   - **Valor:** `cname.vercel-dns.com`
4. Aguarde a propagação (pode levar até 24h)

---

## 7. Estrutura do projeto

```
ml-festas/
├── app/
│   ├── (auth)/login/        — Tela de login
│   ├── (dashboard)/         — Área protegida (admin)
│   │   ├── page.tsx         — Dashboard
│   │   ├── clientes/        — CRM
│   │   ├── encomendas/      — Kanban de encomendas
│   │   ├── locacoes/        — Kanban de locações
│   │   └── calendario/      — Calendário
│   ├── consulta/            — Consulta pública (sem login)
│   └── api/                 — API Routes
├── components/
│   ├── layout/              — Sidebar
│   ├── dashboard/           — Gráficos e cards
│   ├── clientes/            — Formulários e lista
│   ├── kanban/              — Board, cards e formulário de pedido
│   ├── calendario/          — Calendário
│   └── ui/                  — Badge, Modal, ConfirmDialog
├── lib/
│   ├── supabase.ts          — Cliente browser
│   ├── supabase-server.ts   — Cliente server-side
│   └── utils.ts             — Utilitários (formatação, etc.)
├── types/index.ts           — Tipos TypeScript
├── middleware.ts            — Proteção de rotas
├── supabase-schema.sql      — Schema do banco de dados
└── .env.example             — Variáveis de ambiente
```

---

## 8. Personalização

- **Cores:** edite `tailwind.config.ts` (variáveis `gold`, `gold.light`)
- **Fontes:** edite `app/globals.css` (importação do Google Fonts)
- **Colunas do Kanban:** edite as constantes `COLUNAS_ENCOMENDA` e `COLUNAS_LOCACAO` nas páginas de encomendas/locações

---

## Suporte

Sistema desenvolvido especificamente para a ML Festas.
