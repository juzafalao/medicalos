# 🏥 MedicalOS — SaaS de Gestão para Clínicas

> Transformando a gestão clínica em experiência digital de alta performance.

## 📋 Visão Geral

Sistema SaaS multi-tenant completo para consultórios e clínicas médicas, com foco em:
- ✅ **Automação via WhatsApp** (API Oficial)
- ✅ **Redução de no-show** com lembretes automáticos
- ✅ **Agenda inteligente** com gestão de status
- ✅ **Prontuário eletrônico** simplificado
- ✅ **Gestão financeira** com repasse médico
- ✅ **Dashboard executivo** em tempo real
- ✅ **Multi-tenant** com isolamento RLS
- ✅ **100% LGPD compliant**

---

## 🗂️ Estrutura do Projeto

```
medicalos/
├── supabase/
│   ├── 001_schema.sql        # Schema completo PostgreSQL + RLS
│   └── 002_seed.sql          # Templates padrão e dados iniciais
│
├── backend/                  # NestJS API
│   └── src/
│       ├── modules/
│       │   ├── auth/         # JWT + Refresh Token
│       │   ├── patients/     # Gestão de pacientes
│       │   ├── appointments/ # Agenda médica
│       │   ├── whatsapp/     # Automação + Bull Queue
│       │   ├── medical-records/
│       │   ├── financial/    # Financeiro + repasse
│       │   └── dashboard/    # KPIs executivos
│       ├── common/           # Guards, decorators, filters
│       └── config/           # DB + Redis
│
├── frontend/                 # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── dashboard/    # Área logada
│       │   ├── auth/         # Login
│       │   └── pre-cadastro/ # Link público pacientes
│       ├── components/
│       │   └── layout/       # Sidebar + TopBar
│       └── lib/
│           ├── api.ts        # Cliente HTTP centralizado
│           └── store/        # Zustand (auth global)
│
└── docker-compose.yml        # Dev environment completo
```

---

## 🚀 Setup Rápido

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose
- Conta no [Supabase](https://supabase.com) (produção) ou Docker local

### 1. Clonar e instalar

```bash
git clone <repo>

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No SQL Editor, execute em ordem:
   - `supabase/001_schema.sql`
   - `supabase/002_seed.sql`
3. Copie as credenciais de conexão

### 3. Variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
# Edite com suas credenciais do Supabase e serviços

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > frontend/.env.local
```

### 4. Docker Compose (desenvolvimento local)

```bash
# Sobe tudo (Postgres + Redis + Backend + Frontend)
docker-compose up -d

# Ou sem Docker:
cd backend && npm run start:dev
cd frontend && npm run dev
```

### 5. Acessar

| Serviço        | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:3000            |
| Backend API    | http://localhost:3001/api/v1     |
| Swagger Docs   | http://localhost:3001/api/docs   |
| Adminer (DB)   | http://localhost:8080 (opcional) |

---

## 🔐 Perfis de Acesso (RBAC)

| Perfil        | Permissões |
|---------------|------------|
| `admin`       | Acesso total, configurações do tenant |
| `doctor`      | Prontuários, agenda própria, repasse |
| `receptionist`| Agenda, pacientes, financeiro básico |
| `financial`   | Módulo financeiro completo |

---

## 📱 WhatsApp Business API

### Provedores suportados
- **Twilio** (recomendado para MVP)
- **Blip** (mais usado no Brasil)
- **MessageBird** (flexível)

### Configurar no Supabase
```sql
UPDATE tenants SET
  whatsapp_provider = 'twilio',
  whatsapp_api_key = 'seu_auth_token',
  whatsapp_phone_number = '5511999990000'
WHERE slug = 'sua-clinica';
```

### Fluxo de automação
```
Agendamento criado → Confirmação (imediata)
24h antes → Lembrete de confirmação ✅/❌
2h antes → Lembrete final
Após consulta → Follow-up + NPS (2h depois)
Inativo 6 meses → Campanha de recuperação (toda segunda)
```

---

## 💰 Módulo Financeiro

- **Fluxo de caixa** com categorias personalizadas
- **Repasse médico** calculado automaticamente
- **Gráfico mensal** receitas vs despesas
- **Controle de inadimplência** (overdue automático)

---

## 🔒 Segurança & LGPD

- **RLS (Row Level Security)** no PostgreSQL — cada tenant completamente isolado
- **JWT + Refresh Token** com rotação automática
- **Senhas criptografadas** com Argon2
- **Logs de auditoria** em todas operações sensíveis
- **Direito ao esquecimento** — endpoint de exclusão de dados
- **Pré-cadastro via link** — HTTPS, token único por paciente

---

## 📈 Roadmap

### MVP (3 meses)
- [x] Multi-tenant + Auth
- [x] Agenda médica
- [x] Gestão de pacientes
- [x] WhatsApp automático
- [x] Prontuário simplificado
- [x] Financeiro básico
- [x] Dashboard executivo

### v1.1
- [ ] App mobile (React Native)
- [ ] Integração Google Calendar
- [ ] Assinatura digital (ICP-Brasil)
- [ ] TISS para convênios

### v2.0
- [ ] Telemedicina integrada
- [ ] IA Scribe (transcrição de consultas)
- [ ] BI avançado
- [ ] White-label

---

## 🛠️ Stack

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Frontend     | Next.js 14, React, TailwindCSS    |
| Backend      | NestJS, TypeScript                |
| Banco        | PostgreSQL + Supabase             |
| Cache/Filas  | Redis + Bull                      |
| Infra        | Docker, AWS ECS / Vercel          |
| WhatsApp     | Twilio / Blip (API Oficial)       |
| Storage      | AWS S3 / Supabase Storage         |
| CI/CD        | GitHub Actions                    |
| Monitoring   | Datadog / New Relic               |

---

## 📞 Suporte

contato@medicalos.com.br

---

*MedicalOS — © 2025. Construído com ❤️ para modernizar a saúde no Brasil.*
