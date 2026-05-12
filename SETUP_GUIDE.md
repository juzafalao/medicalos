# 🚀 MedicalOS — Guia de Setup (Segunda-feira)

## ✅ Checklist de Início Rápido

### 1. Supabase (10 min)

1. Acesse **supabase.com** → New Project
2. Anote: `Project URL`, `anon key`, `service_role key`, `DB password`
3. Vá em **SQL Editor** e execute nesta ordem:
   ```
   001_schema.sql    ← schema completo + RLS
   002_seed.sql      ← templates e dados padrão
   003_cid10_and_improvements.sql ← CID-10 + views + functions
   ```
4. Em **Settings > Database** → copie a connection string

---

### 2. Backend (5 min)

```bash
cd medicalos/backend
cp .env.example .env
# Editar .env com suas credenciais
npm install
npm run start:dev
# Acesse: http://localhost:3001/api/docs
```

**.env mínimo para funcionar:**
```env
DB_HOST=db.xxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
DB_SSL=true
JWT_SECRET=qualquer_string_32_chars_min
JWT_REFRESH_SECRET=outra_string_32_chars_min
REDIS_HOST=localhost   # ou comentar se não tiver Redis
PORT=3001
```

> 💡 **Sem Redis?** Comente as linhas do BullModule no app.module.ts temporariamente. As filas de WhatsApp não funcionarão, mas o resto sim.

---

### 3. Frontend (3 min)

```bash
cd medicalos/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local
npm install
npm run dev
# Acesse: http://localhost:3000
```

---

### 4. Docker Compose (tudo junto)

```bash
cd medicalos
docker-compose up -d
# Aguarda ~30s para subir tudo
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api/docs
# DB:       localhost:5432
```

---

### 5. Criar primeira clínica

**Via Swagger** (`/api/docs`) ou **curl:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_name": "Clínica MedTest",
    "slug": "medtest",
    "email": "admin@medtest.com",
    "full_name": "Dr. Admin",
    "password": "senha123",
    "phone": "(11) 99999-0000"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medtest.com",
    "password": "senha123",
    "tenant_slug": "medtest"
  }'
```

---

### 6. VSCode — Extensões recomendadas

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "humao.rest-client",
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg"
  ]
}
```

---

### 7. Configurar WhatsApp (Twilio)

1. Crie conta em **twilio.com**
2. Ative o **WhatsApp Sandbox** ou solicite number aprovado
3. Configure via API ou interface:

```bash
curl -X POST http://localhost:3001/api/v1/tenants/me/whatsapp \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "twilio",
    "api_key": "seu_auth_token_twilio",
    "phone_number": "5511999990000"
  }'
```

---

## 📁 Estrutura de Arquivos Gerados

```
medicalos/
├── supabase/
│   ├── 001_schema.sql          ← 18 tabelas + RLS + índices
│   ├── 002_seed.sql            ← Templates WhatsApp + categorias + salas
│   └── 003_cid10_and_improvements.sql ← CID-10 + views + functions SQL
│
├── backend/src/
│   ├── main.ts                 ← Bootstrap + Swagger + guards globais
│   ├── app.module.ts           ← Módulos registrados
│   ├── app.module.final.ts     ← Versão final com todos módulos
│   ├── config/
│   │   ├── database.module.ts  ← Pool PostgreSQL
│   │   └── database.service.ts ← Queries + tenant context + RLS
│   └── modules/
│       ├── auth/               ← JWT + Refresh + registro clínica
│       ├── patients/           ← CRUD + timeline + pré-cadastro
│       ├── appointments/       ← Agenda + slots + conflito
│       ├── medical-records/    ← Prontuário + documentos + CID-10
│       ├── whatsapp/           ← Bull Queue + automação + scheduler
│       ├── financial/          ← Fluxo de caixa + repasse médico
│       ├── dashboard/          ← KPIs executivos
│       ├── users/              ← Equipe + horários + RBAC
│       ├── tenants/            ← Config clínica + LGPD
│       └── rooms/              ← Salas + bloqueios
│
├── frontend/src/
│   ├── app/
│   │   ├── auth/login/         ← Tela de login
│   │   ├── dashboard/          ← Dashboard executivo
│   │   ├── dashboard/agenda/   ← Agenda dia/semana
│   │   ├── dashboard/pacientes/ ← Lista + detail drawer
│   │   ├── dashboard/prontuarios/ ← Lista prontuários
│   │   ├── dashboard/prontuarios/[id]/ ← Prontuário completo
│   │   ├── dashboard/whatsapp/ ← Templates + histórico + envio
│   │   ├── dashboard/financeiro/ ← Lançamentos + gráficos
│   │   └── dashboard/configuracoes/ ← Config + equipe + LGPD
│   │   └── pre-cadastro/[token]/ ← Link público pacientes
│   ├── components/
│   │   ├── layout/sidebar.tsx  ← Sidebar + topbar + RBAC
│   │   └── providers/          ← React Query provider
│   └── lib/
│       ├── api.ts              ← Cliente HTTP completo
│       ├── api-complete.ts     ← Versão final do cliente
│       └── store/auth.store.ts ← Zustand auth + types
│
├── .github/workflows/deploy.yml ← CI/CD GitHub Actions
├── docker-compose.yml           ← Dev environment completo
├── backend/Dockerfile
├── frontend/Dockerfile
└── README.md
```

---

## 🔑 Variáveis de Ambiente — Produção

```env
# Backend (.env produção)
NODE_ENV=production
DB_HOST=db.xxxx.supabase.co
DB_SSL=true
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
REDIS_HOST=redis.seu-provider.com
AWS_S3_BUCKET=medicalos-uploads-prod
TWILIO_ACCOUNT_SID=ACxxxx

# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api/v1
```

---

## 📊 Resumo do Que Foi Gerado

| Item | Qtd |
|------|-----|
| Arquivos de código | ~45 arquivos |
| Linhas de código total | ~8.000+ linhas |
| Tabelas no banco | 18 tabelas |
| Endpoints da API | ~50 endpoints |
| Páginas do frontend | 8 páginas |
| Templates WhatsApp | 6 templates |
| CID-10 na base | 70 códigos MVP |
| Views SQL | 4 views |
| Functions SQL | 2 functions |
| Triggers SQL | 3 triggers |

---

## 🐛 Troubleshooting Comum

**"relation does not exist"**
→ Execute os SQLs na ordem correta no Supabase

**"tenant_id not found"**
→ Verifique se o `SET LOCAL app.tenant_id` está sendo chamado (DatabaseService)

**"401 Unauthorized"**
→ Token expirado — o frontend faz refresh automático via interceptor

**WhatsApp não envia**
→ Verifique provider configurado no tenant + Redis rodando para as filas

**Bull Queue error sem Redis**
→ Comente BullModule no app.module.ts para desenvolvimento sem Redis
