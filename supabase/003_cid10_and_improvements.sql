-- ============================================================
-- MedicalOS - Migration 003: CID-10 Amostras + Melhorias
-- Execute após 001_schema.sql e 002_seed.sql
-- ============================================================

-- ============================================================
-- CID-10 AMOSTRA (principais categorias usadas em clínicas)
-- A tabela completa tem ~70k registros — este é o subset MVP
-- Para importar completo: usar arquivo CID-10 oficial do DATASUS
-- ============================================================

INSERT INTO cid10 (code, description, category) VALUES
-- Doenças respiratórias
('J00', 'Nasofaringite aguda (resfriado comum)', 'Respiratório'),
('J06', 'Infecções agudas das vias aéreas superiores', 'Respiratório'),
('J18', 'Pneumonia por microrganismo não especificado', 'Respiratório'),
('J20', 'Bronquite aguda', 'Respiratório'),
('J45', 'Asma', 'Respiratório'),
('J11', 'Influenza por vírus não identificado', 'Respiratório'),
('J30', 'Rinite alérgica', 'Respiratório'),
('J44', 'DPOC - Doença pulmonar obstrutiva crônica', 'Respiratório'),
-- Cardiovascular
('I10', 'Hipertensão essencial (primária)', 'Cardiovascular'),
('I25', 'Doença isquêmica crônica do coração', 'Cardiovascular'),
('I50', 'Insuficiência cardíaca', 'Cardiovascular'),
('I48', 'Fibrilação e flutter atrial', 'Cardiovascular'),
('I63', 'Infarto cerebral', 'Cardiovascular'),
('I20', 'Angina pectoris', 'Cardiovascular'),
-- Endócrino / Metabólico
('E11', 'Diabetes mellitus tipo 2', 'Endócrino'),
('E10', 'Diabetes mellitus tipo 1', 'Endócrino'),
('E78', 'Distúrbios do metabolismo de lipoproteínas', 'Endócrino'),
('E03', 'Hipotireoidismo', 'Endócrino'),
('E05', 'Tireotoxicose (Hipertireoidismo)', 'Endócrino'),
('E66', 'Obesidade', 'Endócrino'),
-- Digestivo
('K21', 'Doença de refluxo gastroesofágico', 'Digestivo'),
('K29', 'Gastrite e duodenite', 'Digestivo'),
('K57', 'Doença diverticular do intestino', 'Digestivo'),
('K80', 'Colelitíase (pedra na vesícula)', 'Digestivo'),
('K92', 'Outras doenças do aparelho digestivo', 'Digestivo'),
('K58', 'Síndrome do intestino irritável', 'Digestivo'),
-- Osteomuscular
('M54', 'Dorsalgia (dor nas costas)', 'Osteomuscular'),
('M17', 'Gonartrose (Artrose do joelho)', 'Osteomuscular'),
('M79', 'Outros transtornos dos tecidos moles', 'Osteomuscular'),
('M10', 'Gota', 'Osteomuscular'),
('M06', 'Artrite reumatoide', 'Osteomuscular'),
('M47', 'Espondilose', 'Osteomuscular'),
-- Saúde mental
('F32', 'Episódio depressivo', 'Psiquiátrico'),
('F41', 'Transtornos ansiosos', 'Psiquiátrico'),
('F10', 'Transtornos mentais por uso de álcool', 'Psiquiátrico'),
('F43', 'Reações ao stress grave e transtornos de adaptação', 'Psiquiátrico'),
('F20', 'Esquizofrenia', 'Psiquiátrico'),
('F31', 'Transtorno afetivo bipolar', 'Psiquiátrico'),
('F40', 'Transtornos fóbicos ansiosos', 'Psiquiátrico'),
-- Geniturinário
('N39', 'Outros transtornos do trato urinário', 'Geniturinário'),
('N18', 'Doença renal crônica', 'Geniturinário'),
('N40', 'Hiperplasia da próstata', 'Geniturinário'),
('N95', 'Transtornos da menopausa e da perimenopausa', 'Geniturinário'),
('N83', 'Transtornos não inflamatórios do ovário', 'Geniturinário'),
-- Dermatológico
('L30', 'Outras dermatites', 'Dermatológico'),
('L40', 'Psoríase', 'Dermatológico'),
('L20', 'Dermatite atópica', 'Dermatológico'),
('L50', 'Urticária', 'Dermatológico'),
('L70', 'Acne', 'Dermatológico'),
-- Neurológico
('G43', 'Enxaqueca', 'Neurológico'),
('G40', 'Epilepsia', 'Neurológico'),
('G35', 'Esclerose múltipla', 'Neurológico'),
('G20', 'Doença de Parkinson', 'Neurológico'),
('G47', 'Transtornos do sono', 'Neurológico'),
-- Infectocontagioso
('A09', 'Outras gastroenterites e colites', 'Infeccioso'),
('B34', 'Doença por vírus não especificada', 'Infeccioso'),
('A41', 'Septicemia', 'Infeccioso'),
('B19', 'Hepatite viral não especificada', 'Infeccioso'),
-- Odontológico (para clínicas odonto)
('K02', 'Cárie dentária', 'Odontológico'),
('K05', 'Gengivite e doença periodontal', 'Odontológico'),
('K08', 'Outros transtornos dos dentes', 'Odontológico'),
-- Preventivo / Geral
('Z00', 'Exame geral e investigação de pessoas sem queixas', 'Preventivo'),
('Z01', 'Outros exames e investigações especiais', 'Preventivo'),
('Z23', 'Necessidade de imunização contra doenças bacterianas', 'Preventivo'),
('Z76', 'Pessoas em contato com serviços de saúde', 'Preventivo')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- VIEWS ÚTEIS para relatórios
-- ============================================================

-- View: Agenda do dia com todos os dados
CREATE OR REPLACE VIEW vw_today_schedule AS
SELECT
    a.id, a.scheduled_at, a.duration_minutes, a.status,
    a.appointment_type, a.price, a.insurance_name,
    a.is_paid, a.tenant_id,
    p.full_name AS patient_name, p.phone AS patient_phone,
    p.whatsapp AS patient_whatsapp, p.date_of_birth,
    u.full_name AS doctor_name, u.specialty, u.crm,
    r.name AS room_name,
    DATE(a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') AS appointment_date,
    EXTRACT(HOUR FROM a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') AS appointment_hour
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN users u ON u.id = a.doctor_id
LEFT JOIN rooms r ON r.id = a.room_id;

-- View: Fluxo financeiro mensal
CREATE OR REPLACE VIEW vw_monthly_cashflow AS
SELECT
    tenant_id,
    DATE_TRUNC('month', due_date) AS month,
    type,
    SUM(amount) FILTER (WHERE status = 'paid') AS paid_total,
    SUM(amount) FILTER (WHERE status = 'pending') AS pending_total,
    SUM(amount) FILTER (WHERE status = 'overdue') AS overdue_total,
    COUNT(*) AS transaction_count
FROM transactions
GROUP BY tenant_id, DATE_TRUNC('month', due_date), type;

-- View: Pacientes inativos (6+ meses sem consulta)
CREATE OR REPLACE VIEW vw_inactive_patients AS
SELECT
    p.id, p.tenant_id, p.full_name, p.phone, p.whatsapp,
    p.last_appointment_at,
    EXTRACT(DAY FROM NOW() - p.last_appointment_at) AS days_inactive,
    t.name AS clinic_name
FROM patients p
JOIN tenants t ON t.id = p.tenant_id
WHERE p.is_active = true
  AND p.whatsapp IS NOT NULL
  AND (
      p.last_appointment_at < NOW() - INTERVAL '6 months'
      OR p.last_appointment_at IS NULL
  );

-- View: Taxa de no-show por médico
CREATE OR REPLACE VIEW vw_doctor_noshow_rate AS
SELECT
    u.id AS doctor_id,
    u.tenant_id,
    u.full_name AS doctor_name,
    u.specialty,
    COUNT(a.id) AS total_appointments,
    COUNT(a.id) FILTER (WHERE a.status = 'no_show') AS total_no_shows,
    COUNT(a.id) FILTER (WHERE a.status = 'completed') AS total_completed,
    ROUND(
        100.0 * COUNT(a.id) FILTER (WHERE a.status = 'no_show') /
        NULLIF(COUNT(a.id) FILTER (WHERE a.status IN ('completed','no_show')), 0),
    1) AS no_show_rate
FROM users u
LEFT JOIN appointments a ON a.doctor_id = u.id
  AND a.scheduled_at >= NOW() - INTERVAL '30 days'
WHERE u.role = 'doctor'
GROUP BY u.id;

-- ============================================================
-- FUNCTION: Calcula repasse médico automático
-- Chamada ao marcar consulta como completed + paga
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_doctor_commission(
    p_tenant_id UUID,
    p_appointment_id UUID
) RETURNS VOID AS $$
DECLARE
    v_appointment RECORD;
    v_commission_pct DECIMAL;
    v_commission_amount DECIMAL;
BEGIN
    -- Busca dados da consulta
    SELECT a.*, u.commission_percentage, u.full_name
    INTO v_appointment
    FROM appointments a
    JOIN users u ON u.id = a.doctor_id
    WHERE a.id = p_appointment_id AND a.tenant_id = p_tenant_id;

    IF NOT FOUND OR v_appointment.commission_percentage = 0 THEN
        RETURN;
    END IF;

    IF v_appointment.price IS NULL OR v_appointment.price = 0 THEN
        RETURN;
    END IF;

    v_commission_amount := v_appointment.price * (v_appointment.commission_percentage / 100.0);

    -- Insere lançamento de repasse
    INSERT INTO transactions (
        tenant_id, appointment_id, doctor_id, type,
        description, amount, status, due_date,
        is_commission, commission_percentage
    ) VALUES (
        p_tenant_id, p_appointment_id, v_appointment.doctor_id, 'expense',
        'Repasse médico - ' || v_appointment.full_name,
        v_commission_amount,
        'pending',
        CURRENT_DATE,
        true,
        v_appointment.commission_percentage
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Dispara cálculo de repasse ao completar consulta
-- ============================================================
CREATE OR REPLACE FUNCTION trg_appointment_commission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.is_paid = true THEN
        PERFORM calculate_doctor_commission(NEW.tenant_id, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_commission
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION trg_appointment_commission();

-- ============================================================
-- INDEXES ADICIONAIS para performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cid10_code ON cid10(code);
CREATE INDEX IF NOT EXISTS idx_cid10_desc ON cid10 USING gin(to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_transactions_doctor ON transactions(tenant_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_inactive ON patients(tenant_id, last_appointment_at)
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(tenant_id, created_at DESC);
