# TF Arrecada+ 🎯

Plataforma SaaS moderna para gerenciamento de campanhas numeradas, rifas beneficentes e arrecadações. Desenvolvida com React + TypeScript + Vite + Supabase.

---

## 🌐 Demo (GitHub Pages)

> **[https://thawfernandes.github.io/TF-Arrecada-/](https://thawfernandes.github.io/TF-Arrecada-/)**

> ⚠️ A demo requer o banco de dados Supabase configurado (ver abaixo).

---

## ✨ Funcionalidades

- 🔐 **Autenticação própria** — login via username/senha (sem Supabase Auth)
- 🏪 **Dashboard do cliente** — gerenciamento completo de campanhas
- 🎫 **Página pública de campanha** — grade de números, reservas, pagamento PIX
- 🛡️ **Painel TF Hub** — gestão de clientes, licenças e campanhas
- 📊 **Sistema de licenças** — ativo/expirado/bloqueado com alertas automáticos
- 🚀 **Onboarding guiado** — assistente de 5 etapas para novos clientes

---

## 🏗️ Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Estilo | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Custom (tabela `clients` + pgcrypto bcrypt) |
| Deploy | GitHub Pages (static) / Vercel (recomendado para produção) |

---

## 🚀 Setup Local

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/thawfernandes/TF-Arrecada-.git
cd TF-Arrecada-
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 3. Configurar o banco de dados Supabase

No **SQL Editor** do Supabase:
1. Execute `supabase/schema.sql` — cria todas as tabelas, funções e RLS
2. Execute `supabase/seed.sql` — insere admin padrão e cliente de teste

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🔐 Credenciais de Teste (após seed.sql)

| Tipo | Usuário | Senha |
|------|---------|-------|
| **Admin TF Hub** | `admin` | `admintfhubpassword` |
| **Cliente de teste** | `tf_cliente_teste` | `clientetestepassword` |

Para acessar o painel admin: `/login` → clique em **"Acesso TF Hub Admin"**

---

## 📁 Estrutura

```
src/
├── contexts/     # AuthContext — estado global de autenticação
├── services/     # authService, campaignService, clientService...
├── hooks/        # useAuth, useLicenseWarning, useCampaign...
├── pages/        # HomePage, LoginPage, Dashboard, TF Hub...
├── components/   # ProtectedRoute, NumberGrid, Modal...
├── types/        # Todos os tipos TypeScript
├── lib/          # supabase.ts — client configurado
└── utils/        # format.ts, crypto.ts, export.ts

supabase/
├── schema.sql    # Schema completo (tabelas + funções + RLS)
└── seed.sql      # Dados iniciais (admin + cliente de teste)
```

---

## 🌍 Deploy em Produção

### GitHub Pages (demo estática)
O workflow `.github/workflows/deploy.yml` faz deploy automático a cada push na `main`.

Configure os **Secrets** no repositório:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Vercel (recomendado para produção completa)
```bash
vercel --prod
```
Configure as variáveis de ambiente no painel da Vercel. O React Router funciona nativamente sem configuração adicional.

---

## 🗺️ Rotas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Home — 2 botões de entrada | Público |
| `/login` | Login por username/senha | Público |
| `/dashboard` | Painel do cliente | Autenticado |
| `/onboarding` | Assistente primeiro acesso | Autenticado |
| `/licenca-expirada` | Tela de licença expirada | Público |
| `/campanha/:shareCode` | Página pública da campanha | Público |
| `/tfhub` | Dashboard admin TF Hub | Admin |
| `/tfhub/clientes` | Gerenciar clientes | Admin |
| `/tfhub/licencas` | Gerenciar licenças | Admin |
| `/tfhub/campanhas` | Gerenciar campanhas | Admin |

---

## ⚡ Produzido pela TF - Versão 1.0.0

