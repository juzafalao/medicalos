// ============================================================
// modules/tenants/tenants.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class TenantsService {
  constructor(private readonly db: DatabaseService) {}

  async findById(tenantId: string) {
    const tenant = await this.db.queryOne(
      `SELECT id, name, slug, cnpj, email, phone, logo_url,
              address_street, address_number, address_city, address_state, address_zip,
              subscription_plan, subscription_status, subscription_expires_at,
              whatsapp_provider, whatsapp_phone_number,
              settings, trial_ends_at, is_active, created_at
       FROM tenants WHERE id = $1`,
      [tenantId],
    );
    if (!tenant) throw new NotFoundException('Clínica não encontrada');
    return tenant;
  }

  async update(tenantId: string, dto: Record<string, any>) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (!entries.length) return this.findById(tenantId);
    const fields = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = entries.map(([, v]) => v);
    return this.db.queryOne(
      `UPDATE tenants SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [tenantId, ...values],
    );
  }

  async configureWhatsapp(tenantId: string, dto: { provider: string; api_key: string; phone_number: string }) {
    return this.db.queryOne(
      `UPDATE tenants SET
         whatsapp_provider    = $2,
         whatsapp_api_key     = $3,
         whatsapp_phone_number = $4,
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, whatsapp_provider, whatsapp_phone_number`,
      [tenantId, dto.provider, dto.api_key, dto.phone_number],
    );
  }

  async getStats(tenantId: string) {
    const [patients, appointments, revenue, whatsapp] = await Promise.all([
      this.db.queryOneWithTenant(tenantId,
        `SELECT COUNT(*) AS total,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS last_month
         FROM patients WHERE tenant_id = $1`, [tenantId]),
      this.db.queryOneWithTenant(tenantId,
        `SELECT COUNT(*) AS total,
                COUNT(CASE WHEN status='completed' THEN 1 END) AS completed,
                COUNT(CASE WHEN status='no_show'   THEN 1 END) AS no_shows
         FROM appointments WHERE tenant_id = $1`, [tenantId]),
      this.db.queryOneWithTenant(tenantId,
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE tenant_id = $1 AND type='income' AND status='paid'
           AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NOW())`, [tenantId]),
      this.db.queryOneWithTenant(tenantId,
        `SELECT COUNT(*) AS total_sent,
                COUNT(CASE WHEN status='read' THEN 1 END) AS total_read
         FROM whatsapp_messages
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`, [tenantId]),
    ]);
    return { patients, appointments, revenue, whatsapp };
  }

  async exportPatientData(tenantId: string, patientId: string) {
    const [patient, appointments, records, documents, messages] = await Promise.all([
      this.db.queryOneWithTenant(tenantId,
        'SELECT * FROM patients WHERE id = $1 AND tenant_id = $2', [patientId, tenantId]),
      this.db.queryWithTenant(tenantId,
        'SELECT * FROM appointments WHERE patient_id = $1 AND tenant_id = $2', [patientId, tenantId]),
      this.db.queryWithTenant(tenantId,
        'SELECT id, created_at, diagnosis, evolution FROM medical_records WHERE patient_id = $1 AND tenant_id = $2',
        [patientId, tenantId]),
      this.db.queryWithTenant(tenantId,
        'SELECT type, title, created_at FROM documents WHERE patient_id = $1 AND tenant_id = $2',
        [patientId, tenantId]),
      this.db.queryWithTenant(tenantId,
        'SELECT type, status, created_at FROM whatsapp_messages WHERE patient_id = $1 AND tenant_id = $2',
        [patientId, tenantId]),
    ]);
    return {
      exported_at: new Date().toISOString(),
      lgpd_note: 'Exportação conforme Art. 18 da LGPD (Lei 13.709/2018)',
      patient, appointments, medical_records: records, documents, whatsapp_messages: messages,
    };
  }

  async anonymizePatient(tenantId: string, patientId: string) {
    return this.db.transactionWithTenant(tenantId, async (client) => {
      await client.query(
        `UPDATE patients SET
           full_name = 'DADOS REMOVIDOS', email = NULL, phone = 'REMOVIDO',
           whatsapp = NULL, cpf = NULL, rg = NULL, date_of_birth = NULL,
           allergies = NULL, notes = NULL, is_active = false, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [patientId, tenantId],
      );
      await client.query(
        `INSERT INTO audit_logs (tenant_id, action, resource_type, resource_id)
         VALUES ($1, 'LGPD_ANONYMIZE', 'patient', $2)`,
        [tenantId, patientId],
      );
      return { message: 'Dados pessoais anonimizados conforme LGPD' };
    });
  }
}
