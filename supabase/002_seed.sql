-- ============================================================
-- MedicalOS - Seed Data
-- Templates padrão de WhatsApp e categorias financeiras
-- ============================================================

-- Inserir tenant de demonstração
INSERT INTO tenants (id, name, slug, email, phone, subscription_plan, subscription_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Clínica Demo MedicalOS',
    'demo',
    'demo@medicalos.com.br',
    '(11) 99999-0000',
    'professional',
    'active'
);

-- ============================================================
-- WHATSAPP TEMPLATES PADRÃO (por tenant demo)
-- ============================================================

INSERT INTO whatsapp_templates (tenant_id, type, name, message, is_active) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'confirmation',
    'Confirmação de Consulta',
    'Olá, {{patient_name}}! 👋

Sua consulta com *Dr(a). {{doctor_name}}* está agendada para:
📅 *{{appointment_date}}* às *{{appointment_time}}*
📍 {{clinic_name}}

Para confirmar sua presença, responda *SIM*.
Para cancelar ou reagendar, responda *NÃO*.

Qualquer dúvida, estamos à disposição! 😊',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'reminder',
    'Lembrete 2h Antes',
    'Olá, {{patient_name}}! ⏰

Lembrando que sua consulta com *Dr(a). {{doctor_name}}* é *hoje* às *{{appointment_time}}*.

📍 {{clinic_address}}

Até já! 😊',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'followup',
    'Follow-up Pós Consulta (NPS)',
    'Olá, {{patient_name}}! 💙

Esperamos que esteja bem após sua consulta de hoje com *Dr(a). {{doctor_name}}*.

Em uma escala de *0 a 10*, o quanto você nos recomendaria para um amigo ou familiar?

Responda com o número. Sua opinião é muito importante para nós! 🙏',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'recovery',
    'Recuperação de Paciente Inativo',
    'Olá, {{patient_name}}! 😊

Sentimos sua falta aqui na *{{clinic_name}}*!

Faz um tempinho que não nos vemos. Que tal agendar uma consulta de acompanhamento?

👨‍⚕️ Nossos profissionais estão disponíveis para te atender.

Responda esta mensagem para agendar ou acesse: {{booking_link}}',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'delay',
    'Aviso de Atraso',
    'Olá, {{patient_name}}! 

Informamos que o(a) *Dr(a). {{doctor_name}}* está com um pequeno atraso de aproximadamente *{{delay_minutes}} minutos*.

Pedimos desculpas pelo inconveniente. Você ainda estará sendo atendido(a) hoje! 🙏',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'nps',
    'Pesquisa NPS Seguimento',
    'Obrigado pela sua avaliação, {{patient_name}}! ⭐

{{#if high_score}}
Fico feliz que tenha gostado! Você toparia nos indicar para amigos e família? 😊
{{else}}
Lamentamos que sua experiência não tenha sido a melhor. Pode nos contar o que aconteceu? Queremos melhorar! 🙏
{{/if}}',
    true
);

-- ============================================================
-- CATEGORIAS FINANCEIRAS PADRÃO
-- ============================================================

INSERT INTO financial_categories (tenant_id, name, type, color) VALUES
-- Receitas
('00000000-0000-0000-0000-000000000001', 'Consulta Particular', 'income', '#10B981'),
('00000000-0000-0000-0000-000000000001', 'Consulta Convênio', 'income', '#3B82F6'),
('00000000-0000-0000-0000-000000000001', 'Procedimento', 'income', '#8B5CF6'),
('00000000-0000-0000-0000-000000000001', 'Exame', 'income', '#F59E0B'),
('00000000-0000-0000-0000-000000000001', 'Outros Recebimentos', 'income', '#6B7280'),
-- Despesas
('00000000-0000-0000-0000-000000000001', 'Aluguel', 'expense', '#EF4444'),
('00000000-0000-0000-0000-000000000001', 'Salários', 'expense', '#F97316'),
('00000000-0000-0000-0000-000000000001', 'Material de Escritório', 'expense', '#EC4899'),
('00000000-0000-0000-0000-000000000001', 'Equipamentos', 'expense', '#14B8A6'),
('00000000-0000-0000-0000-000000000001', 'Marketing', 'expense', '#A855F7'),
('00000000-0000-0000-0000-000000000001', 'Serviços Terceiros', 'expense', '#6366F1'),
('00000000-0000-0000-0000-000000000001', 'Impostos', 'expense', '#DC2626'),
('00000000-0000-0000-0000-000000000001', 'Repasse Médico', 'expense', '#0EA5E9'),
('00000000-0000-0000-0000-000000000001', 'Outros Gastos', 'expense', '#9CA3AF');

-- ============================================================
-- DOCUMENT TEMPLATES PADRÃO
-- ============================================================

INSERT INTO document_templates (tenant_id, name, type, content) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Receita Simples',
    'prescription',
    'RECEITUÁRIO MÉDICO

Paciente: {{patient_name}}
Data: {{date}}

{{prescription_content}}

_________________________________
Dr(a). {{doctor_name}}
CRM: {{doctor_crm}} | {{doctor_state}}
{{clinic_name}} - {{clinic_address}}'
),
(
    '00000000-0000-0000-0000-000000000001',
    'Atestado Médico',
    'certificate',
    'ATESTADO MÉDICO

Atesto, para os devidos fins, que o(a) paciente {{patient_name}},
portador(a) do CPF {{patient_cpf}}, encontra-se sob meus cuidados médicos,
necessitando de afastamento de suas atividades pelo período de {{days}} dia(s),
a partir de {{start_date}}.

{{additional_info}}

{{city}}, {{date}}

_________________________________
Dr(a). {{doctor_name}}
CRM: {{doctor_crm}} | {{doctor_state}}'
),
(
    '00000000-0000-0000-0000-000000000001',
    'Encaminhamento',
    'referral',
    'ENCAMINHAMENTO MÉDICO

Encaminho o(a) paciente {{patient_name}}, {{patient_age}} anos,
para avaliação com especialista em {{specialty}}.

Motivo: {{reason}}

História clínica resumida:
{{clinical_history}}

{{city}}, {{date}}

_________________________________
Dr(a). {{doctor_name}}
CRM: {{doctor_crm}} | {{doctor_state}}
Especialidade: {{doctor_specialty}}'
);

-- ============================================================
-- ROOMS PADRÃO
-- ============================================================

INSERT INTO rooms (tenant_id, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Consultório 1', 'Sala de atendimento principal'),
('00000000-0000-0000-0000-000000000001', 'Consultório 2', 'Sala de atendimento secundária'),
('00000000-0000-0000-0000-000000000001', 'Sala de Procedimentos', 'Para procedimentos e exames');
