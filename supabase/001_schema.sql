-- ============================================================
-- MedicalOS - Schema Principal (Supabase / PostgreSQL)
-- Versão: 1.0 | Arquitetura: Multi-Tenant com RLS
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'financial');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'insurance', 'bank_transfer');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE whatsapp_message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE whatsapp_template_type AS ENUM ('confirmation', 'reminder', 'followup', 'recovery', 'delay', 'nps');
CREATE TYPE document_type AS ENUM ('prescription', 'certificate', 'referral', 'exam_request', 'other');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'not_informed');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');

-- ============================================================
-- TENANTS (Clínicas)
-- ============================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    logo_url TEXT,
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zip VARCHAR(9),
    subscription_plan subscription_plan DEFAULT 'starter', -- CORREÇÃO AQUI
    subscription_status subscription_status DEFAULT 'trial',
    subscription_expires_at TIMESTAMPTZ,
    whatsapp_provider VARCHAR(50),
    whatsapp_api_key TEXT,
    whatsapp_phone_number VARCHAR(20),
    google_calendar_token TEXT,
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_user VARCHAR(255),
    smtp_password TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (Usuários do sistema)
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'receptionist',
    phone VARCHAR(20),
    avatar_url TEXT,
    crm VARCHAR(20),                   -- somente para médicos
    specialty VARCHAR(100),            -- somente para médicos
    commission_percentage DECIMAL(5,2) DEFAULT 0, -- % de repasse
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- ============================================================
-- PATIENTS (Pacientes)
-- ============================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    date_of_birth DATE,
    gender gender DEFAULT 'not_informed',
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zip VARCHAR(9),
    insurance_name VARCHAR(100),
    insurance_number VARCHAR(50),
    insurance_plan VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    blood_type VARCHAR(5),
    allergies TEXT,
    notes TEXT,                         -- observações internas
    pre_registration_token UUID DEFAULT uuid_generate_v4(), -- token para link público
    pre_registration_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_appointment_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOMS (Salas de atendimento)
-- ============================================================

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKING HOURS (Horários de trabalho dos médicos)
-- ============================================================

CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 6=Sáb
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30, -- minutos por consulta
    is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- BLOCKED SLOTS (Bloqueios de agenda)
-- ============================================================

CREATE TABLE blocked_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS (Consultas / Agendamentos)
-- ============================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    room_id UUID REFERENCES rooms(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    appointment_type VARCHAR(100),      -- consulta, retorno, procedimento, etc.
    reason TEXT,                        -- motivo da consulta
    notes TEXT,                         -- notas internas
    insurance_name VARCHAR(100),
    insurance_auth_code VARCHAR(50),    -- código de autorização do plano
    price DECIMAL(10,2),
    payment_method payment_method,
    is_paid BOOLEAN DEFAULT false,
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    followup_sent_at TIMESTAMPTZ,
    google_calendar_event_id VARCHAR(255),
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEDICAL RECORDS (Prontuários)
-- ============================================================

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    anamnesis TEXT,                     -- anamnese
    physical_exam TEXT,                 -- exame físico
    evolution TEXT,                     -- evolução clínica
    diagnosis TEXT,
    cid10_codes VARCHAR(10)[],          -- array de códigos CID-10
    treatment_plan TEXT,
    observations TEXT,
    vital_signs JSONB,                  -- { weight, height, bp, temperature, etc. }
    is_signed BOOLEAN DEFAULT false,    -- assinado digitalmente
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS (Documentos gerados)
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    type document_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,              -- conteúdo do documento
    file_url TEXT,                      -- URL no S3/GCS após geração PDF
    is_signed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTACHMENTS (Exames e documentos do paciente)
-- ============================================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id),
    uploaded_by UUID REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSURANCE PLANS (Convênios)
-- ============================================================

CREATE TABLE insurance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    ans_code VARCHAR(20),               -- código na ANS
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSURANCE PROCEDURES (Tabela de procedimentos por convênio)
-- ============================================================

CREATE TABLE insurance_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    insurance_plan_id UUID NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
    tuss_code VARCHAR(20),              -- código TUSS
    description VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- FINANCIAL CATEGORIES
-- ============================================================

CREATE TABLE financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type transaction_type NOT NULL,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (Financeiro)
-- ============================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),    -- para cálculo de repasse
    category_id UUID REFERENCES financial_categories(id),
    type transaction_type NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method,
    status transaction_status DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    is_commission BOOLEAN DEFAULT false,    -- flag para repasse médico
    commission_percentage DECIMAL(5,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WHATSAPP TEMPLATES
-- ============================================================

CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type whatsapp_template_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,              -- suporta variáveis: {{patient_name}}, {{date}}, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WHATSAPP MESSAGES (Log de mensagens)
-- ============================================================

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    template_id UUID REFERENCES whatsapp_templates(id),
    type whatsapp_template_type NOT NULL,
    phone_to VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status whatsapp_message_status DEFAULT 'pending',
    external_message_id VARCHAR(255),   -- ID retornado pelo provedor
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NPS RESPONSES (Pesquisa de satisfação)
-- ============================================================

CREATE TABLE nps_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID REFERENCES users(id),
    score INTEGER CHECK (score BETWEEN 0 AND 10),
    comment TEXT,
    responded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS (LGPD - Logs de auditoria)
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,       -- READ_RECORD, UPDATE_PATIENT, DELETE_DATA, etc.
    resource_type VARCHAR(100) NOT NULL, -- medical_record, patient, etc.
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    changes JSONB,                      -- diff das mudanças (old vs new)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT TEMPLATES (Templates de documentos clínicos)
-- ============================================================

CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type document_type NOT NULL,
    content TEXT NOT NULL,              -- template com variáveis {{patient_name}}, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CID10 (Tabela de classificação de doenças)
-- ============================================================

CREATE TABLE cid10 (
    code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(100)
);

-- ============================================================
-- INDEXES (Performance)
-- ============================================================

-- Appointments
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(tenant_id, doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(tenant_id, patient_id);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_date ON appointments(tenant_id, scheduled_at);

-- Patients
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_phone ON patients(tenant_id, phone);
CREATE INDEX idx_patients_name ON patients(tenant_id, full_name);
CREATE INDEX idx_patients_token ON patients(pre_registration_token);

-- Medical Records
CREATE INDEX idx_medical_records_patient ON medical_records(tenant_id, patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);

-- Transactions
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_date ON transactions(tenant_id, due_date);
CREATE INDEX idx_transactions_status ON transactions(tenant_id, status);

-- WhatsApp Messages
CREATE INDEX idx_whatsapp_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(tenant_id, status);

-- Audit
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_resource ON audit_logs(tenant_id, resource_type, resource_id);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Isolamento Multi-Tenant
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para extrair tenant_id do JWT
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (current_setting('app.tenant_id', true))::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Políticas RLS para cada tabela
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_appointments ON appointments
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_medical_records ON medical_records
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_documents ON documents
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_attachments ON attachments
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_transactions ON transactions
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_whatsapp_messages ON whatsapp_messages
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_whatsapp_templates ON whatsapp_templates
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_rooms ON rooms
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_working_hours ON working_hours
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_blocked_slots ON blocked_slots
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_insurance_plans ON insurance_plans
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_insurance_procedures ON insurance_procedures
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_financial_categories ON financial_categories
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_nps ON nps_responses
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_document_templates ON document_templates
    FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY tenant_isolation_audit ON audit_logs
    FOR ALL USING (tenant_id = get_tenant_id());

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
