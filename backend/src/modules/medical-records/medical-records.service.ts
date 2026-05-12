import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly db: DatabaseService) {}

  async findByPatient(tenantId: string, patientId: string, requesterId: string, role: string) {
    const doctorFilter = role === 'doctor' ? `AND mr.doctor_id = '${requesterId}'` : '';
    return this.db.queryWithTenant(tenantId,
      `SELECT mr.id, mr.created_at, mr.updated_at, mr.diagnosis, mr.evolution,
              mr.cid10_codes, mr.vital_signs, mr.is_signed, mr.signed_at,
              mr.anamnesis, mr.physical_exam, mr.treatment_plan,
              u.full_name AS doctor_name, u.specialty AS doctor_specialty, u.crm AS doctor_crm,
              a.scheduled_at AS appointment_date, a.appointment_type, p.full_name AS patient_name,
              (SELECT COUNT(*) FROM documents d WHERE d.medical_record_id = mr.id) AS total_documents,
              (SELECT COUNT(*) FROM attachments att WHERE att.medical_record_id = mr.id) AS total_attachments
       FROM medical_records mr
       JOIN users u ON u.id = mr.doctor_id
       JOIN patients p ON p.id = mr.patient_id
       LEFT JOIN appointments a ON a.id = mr.appointment_id
       WHERE mr.patient_id = $1 AND mr.tenant_id = $2 ${doctorFilter}
       ORDER BY mr.created_at DESC`,
      [patientId, tenantId],
    );
  }

  async findOne(tenantId: string, id: string, requesterId: string, role: string) {
    const record = await this.db.queryOneWithTenant(tenantId,
      `SELECT mr.*,
              u.full_name AS doctor_name, u.specialty AS doctor_specialty,
              u.crm AS doctor_crm, u.email AS doctor_email,
              p.full_name AS patient_name, p.date_of_birth AS patient_dob,
              p.cpf AS patient_cpf, p.phone AS patient_phone,
              p.insurance_name, p.blood_type, p.allergies,
              a.scheduled_at AS appointment_date, a.appointment_type,
              json_agg(DISTINCT jsonb_build_object(
                'id', d.id, 'type', d.type, 'title', d.title,
                'file_url', d.file_url, 'created_at', d.created_at, 'is_signed', d.is_signed
              )) FILTER (WHERE d.id IS NOT NULL) AS documents,
              json_agg(DISTINCT jsonb_build_object(
                'id', att.id, 'file_name', att.file_name, 'file_url', att.file_url,
                'mime_type', att.mime_type, 'description', att.description
              )) FILTER (WHERE att.id IS NOT NULL) AS attachments
       FROM medical_records mr
       JOIN users u ON u.id = mr.doctor_id
       JOIN patients p ON p.id = mr.patient_id
       LEFT JOIN appointments a ON a.id = mr.appointment_id
       LEFT JOIN documents d ON d.medical_record_id = mr.id
       LEFT JOIN attachments att ON att.medical_record_id = mr.id
       WHERE mr.id = $1 AND mr.tenant_id = $2
       GROUP BY mr.id, u.id, p.id, a.id`,
      [id, tenantId],
    );
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    if (role === 'doctor' && record.doctor_id !== requesterId)
      throw new ForbiddenException('Acesso negado a este prontuário');
    await this.logAccess(tenantId, requesterId, 'READ_RECORD', id);
    return record;
  }

  async create(tenantId: string, dto: any, doctorId: string) {
    const record = await this.db.queryOneWithTenant(tenantId,
      `INSERT INTO medical_records (
         tenant_id, patient_id, appointment_id, doctor_id,
         anamnesis, physical_exam, evolution, diagnosis,
         cid10_codes, treatment_plan, observations, vital_signs
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        tenantId, dto.patient_id, dto.appointment_id ?? null, doctorId,
        dto.anamnesis ?? null, dto.physical_exam ?? null, dto.evolution ?? null,
        dto.diagnosis ?? null,
        dto.cid10_codes?.length ? `{${dto.cid10_codes.join(',')}}` : null,
        dto.treatment_plan ?? null, dto.observations ?? null,
        dto.vital_signs ? JSON.stringify(dto.vital_signs) : null,
      ],
    );
    if (dto.appointment_id) {
      await this.db.queryWithTenant(tenantId,
        `UPDATE appointments SET status = 'in_progress'
         WHERE id = $1 AND status IN ('waiting','confirmed','scheduled')`,
        [dto.appointment_id],
      );
    }
    await this.logAccess(tenantId, doctorId, 'CREATE_RECORD', record.id);
    return record;
  }

  async update(tenantId: string, id: string, dto: any, doctorId: string, role: string) {
    const existing = await this.db.queryOneWithTenant(tenantId,
      'SELECT id, doctor_id, is_signed FROM medical_records WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!existing) throw new NotFoundException('Prontuário não encontrado');
    if (role === 'doctor' && existing.doctor_id !== doctorId) throw new ForbiddenException();
    if (existing.is_signed && !dto.is_signed) throw new ForbiddenException('Prontuário já assinado');

    const fieldMap: Record<string, string> = {
      anamnesis: 'anamnesis', physical_exam: 'physical_exam', evolution: 'evolution',
      diagnosis: 'diagnosis', treatment_plan: 'treatment_plan', observations: 'observations',
    };
    const setClauses = ['updated_at = NOW()'];
    const values: any[] = [id, tenantId];
    let idx = 3;
    for (const [key, col] of Object.entries(fieldMap)) {
      if (dto[key] !== undefined) { setClauses.push(`${col} = $${idx++}`); values.push(dto[key]); }
    }
    if (dto.cid10_codes !== undefined) {
      setClauses.push(`cid10_codes = $${idx++}`);
      values.push(dto.cid10_codes.length ? `{${dto.cid10_codes.join(',')}}` : null);
    }
    if (dto.vital_signs !== undefined) {
      setClauses.push(`vital_signs = $${idx++}`);
      values.push(JSON.stringify(dto.vital_signs));
    }
    if (dto.is_signed === true) setClauses.push('is_signed = true', 'signed_at = NOW()');

    const record = await this.db.queryOneWithTenant(tenantId,
      `UPDATE medical_records SET ${setClauses.join(', ')}
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      values,
    );
    await this.logAccess(tenantId, doctorId, 'UPDATE_RECORD', id, dto);
    return record;
  }

  async searchCid10(query: string) {
    return this.db.query(
      `SELECT code, description, category FROM cid10
       WHERE code ILIKE $1 OR description ILIKE $1
       ORDER BY CASE WHEN code ILIKE $1 THEN 0 ELSE 1 END, code
       LIMIT 20`,
      [`%${query}%`],
    );
  }

  async getDoctorStats(tenantId: string, doctorId: string) {
    return this.db.queryOneWithTenant(tenantId,
      `SELECT COUNT(*) AS total_records,
              COUNT(CASE WHEN is_signed = true THEN 1 END) AS signed_records,
              COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS last_30_days
       FROM medical_records WHERE doctor_id = $1 AND tenant_id = $2`,
      [doctorId, tenantId],
    );
  }

  private async logAccess(tenantId: string, userId: string, action: string, recordId: string, changes?: any) {
    await this.db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, changes)
       VALUES ($1,$2,$3,'medical_record',$4,$5)`,
      [tenantId, userId, action, recordId, changes ? JSON.stringify(changes) : null],
    ).catch(() => {});
  }
}
