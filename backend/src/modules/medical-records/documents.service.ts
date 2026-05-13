// ============================================================
// DOCUMENTS SERVICE - Geração de documentos clínicos
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly db: DatabaseService) {}

  // Renderiza template com dados reais do paciente/médico
  private renderTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  }

  private buildVars(data: {
    patient: any;
    doctor: any;
    tenant: any;
    content?: string;
    extra?: Record<string, string>;
  }): Record<string, string> {
    const now = new Date();
    const age = data.patient.date_of_birth
      ? Math.floor((Date.now() - new Date(data.patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 0;

    return {
      patient_name: data.patient.full_name || '',
      patient_cpf: data.patient.cpf || '',
      patient_age: String(age),
      patient_phone: data.patient.phone || '',
      doctor_name: data.doctor.full_name || '',
      doctor_crm: data.doctor.crm || '',
      doctor_state: data.doctor.crm_state || 'SP',
      doctor_specialty: data.doctor.specialty || '',
      clinic_name: data.tenant.name || '',
      clinic_address: [data.tenant.address_street, data.tenant.address_number, data.tenant.address_city].filter(Boolean).join(', '),
      clinic_phone: data.tenant.phone || '',
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      city: data.tenant.address_city || '',
      prescription_content: data.content || '',
      ...(data.extra || {}),
    };
  }

  async createDocument(
    tenantId: string,
    doctorId: string,
    dto: {
      patient_id: string;
      medical_record_id?: string;
      type: 'prescription' | 'certificate' | 'referral' | 'exam_request' | 'other';
      title: string;
      template_id?: string;
      content?: string;
      extra_vars?: Record<string, string>;
    },
  ) {
    // Carrega dados necessários com contexto de tenant para garantir isolamento
    const [patient, doctor, tenant] = await Promise.all([
      this.db.queryOneWithTenant(tenantId, 'SELECT * FROM patients WHERE id = $1 AND tenant_id = $2', [dto.patient_id, tenantId]),
      this.db.queryOneWithTenant(tenantId, 'SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [doctorId, tenantId]),
      this.db.queryOne('SELECT * FROM tenants WHERE id = $1', [tenantId]),
    ]);

    if (!patient) throw new NotFoundException('Paciente não encontrado');

    let finalContent = dto.content || '';

    // Se foi passado um template, usa o template do banco
    if (dto.template_id) {
      const tmpl = await this.db.queryOneWithTenant(
        tenantId,
        'SELECT content FROM document_templates WHERE id = $1 AND tenant_id = $2',
        [dto.template_id, tenantId],
      );
      if (tmpl) {
        finalContent = this.renderTemplate(
          tmpl.content,
          this.buildVars({ patient, doctor, tenant, content: dto.content, extra: dto.extra_vars }),
        );
      }
    }

    const document = await this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO documents (tenant_id, patient_id, medical_record_id, doctor_id, type, title, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tenantId, dto.patient_id, dto.medical_record_id, doctorId, dto.type, dto.title, finalContent],
    );

    return document;
  }

  async getDocumentTemplates(tenantId: string, type?: string) {
    const typeFilter = type ? 'AND type = $2' : '';
    return this.db.queryWithTenant(
      tenantId,
      `SELECT * FROM document_templates WHERE tenant_id = $1 ${typeFilter} AND is_active = true ORDER BY name`,
      type ? [tenantId, type] : [tenantId],
    );
  }

  async getPatientDocuments(tenantId: string, patientId: string) {
    return this.db.queryWithTenant(
      tenantId,
      `SELECT d.*, u.full_name as doctor_name
       FROM documents d JOIN users u ON u.id = d.doctor_id
       WHERE d.patient_id = $1 AND d.tenant_id = $2
       ORDER BY d.created_at DESC`,
      [patientId, tenantId],
    );
  }

  async signDocument(tenantId: string, documentId: string, doctorId: string) {
    return this.db.queryOneWithTenant(
      tenantId,
      `UPDATE documents SET is_signed = true WHERE id = $1 AND doctor_id = $2 AND tenant_id = $3 RETURNING *`,
      [documentId, doctorId, tenantId],
    );
  }
}
