// ============================================================
// modules/patients/patients.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

export interface CreatePatientDto {
  full_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'not_informed';
  blood_type?: string;
  allergies?: string;
  notes?: string;
  insurance_name?: string;
  insurance_number?: string;
  insurance_plan?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

@Injectable()
export class PatientsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const { offset } = this.db.buildPaginationQuery(page, limit);
    const hasSearch  = !!search;
    const searchCond = hasSearch
      ? 'AND (p.full_name ILIKE $4 OR p.phone ILIKE $4 OR p.cpf ILIKE $4 OR p.email ILIKE $4)'
      : '';
    const params = hasSearch
      ? [tenantId, limit, offset, `%${search}%`]
      : [tenantId, limit, offset];

    const [patients, countResult] = await Promise.all([
      this.db.queryWithTenant(
        tenantId,
        `SELECT
           p.id, p.full_name, p.phone, p.whatsapp, p.email,
           p.cpf, p.date_of_birth, p.gender, p.insurance_name,
           p.blood_type, p.allergies, p.is_active,
           p.last_appointment_at, p.pre_registration_token,
           p.pre_registration_completed, p.created_at,
           COUNT(a.id) AS total_appointments
         FROM patients p
         LEFT JOIN appointments a ON a.patient_id = p.id AND a.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 ${searchCond}
         GROUP BY p.id
         ORDER BY p.full_name ASC
         LIMIT $2 OFFSET $3`,
        params,
      ),
      this.db.queryOneWithTenant(
        tenantId,
        `SELECT COUNT(*) AS total FROM patients
         WHERE tenant_id = $1 ${hasSearch ? 'AND (full_name ILIKE $2 OR phone ILIKE $2 OR cpf ILIKE $2)' : ''}`,
        hasSearch ? [tenantId, `%${search}%`] : [tenantId],
      ),
    ]);

    return {
      data: patients,
      meta: { total: parseInt(countResult?.total ?? '0'), page, limit },
    };
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.db.queryOneWithTenant(
      tenantId,
      `SELECT p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', a.id,
                  'scheduled_at', a.scheduled_at,
                  'status', a.status,
                  'doctor_name', u.full_name,
                  'appointment_type', a.appointment_type
                ) ORDER BY a.scheduled_at DESC
              ) FILTER (WHERE a.id IS NOT NULL) AS appointments
       FROM patients p
       LEFT JOIN appointments a ON a.patient_id = p.id AND a.tenant_id = p.tenant_id
       LEFT JOIN users u ON u.id = a.doctor_id
       WHERE p.id = $1 AND p.tenant_id = $2
       GROUP BY p.id`,
      [id, tenantId],
    );
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async create(tenantId: string, dto: CreatePatientDto, _createdBy: string) {
    return this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO patients (
         tenant_id, full_name, phone, whatsapp, email, cpf,
         date_of_birth, gender, blood_type, allergies, notes,
         insurance_name, insurance_number, insurance_plan,
         address_street, address_number, address_complement,
         address_city, address_state, address_zip
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
       ) RETURNING *`,
      [
        tenantId,
        dto.full_name,
        dto.phone,
        dto.whatsapp ?? dto.phone,
        dto.email ?? null,
        dto.cpf ?? null,
        dto.date_of_birth ?? null,
        dto.gender ?? 'not_informed',
        dto.blood_type ?? null,
        dto.allergies ?? null,
        dto.notes ?? null,
        dto.insurance_name ?? null,
        dto.insurance_number ?? null,
        dto.insurance_plan ?? null,
        dto.address_street ?? null,
        dto.address_number ?? null,
        dto.address_complement ?? null,
        dto.address_city ?? null,
        dto.address_state ?? null,
        dto.address_zip ?? null,
      ],
    );
  }

  async update(tenantId: string, id: string, dto: Partial<CreatePatientDto>) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (!entries.length) return this.findOne(tenantId, id);

    const fields = entries.map(([k], i) => `${k} = $${i + 3}`).join(', ');
    const values = entries.map(([, v]) => v);

    const patient = await this.db.queryOneWithTenant(
      tenantId,
      `UPDATE patients SET ${fields}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, ...values],
    );
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async getTimeline(tenantId: string, patientId: string) {
    const [appointments, records, documents, messages] = await Promise.all([
      this.db.queryWithTenant(
        tenantId,
        `SELECT a.id, a.scheduled_at, a.status, a.appointment_type, a.price,
                u.full_name AS doctor_name
         FROM appointments a
         JOIN users u ON u.id = a.doctor_id
         WHERE a.patient_id = $1 AND a.tenant_id = $2
         ORDER BY a.scheduled_at DESC LIMIT 20`,
        [patientId, tenantId],
      ),
      this.db.queryWithTenant(
        tenantId,
        `SELECT mr.id, mr.created_at, mr.diagnosis, mr.evolution,
                u.full_name AS doctor_name
         FROM medical_records mr
         JOIN users u ON u.id = mr.doctor_id
         WHERE mr.patient_id = $1 AND mr.tenant_id = $2
         ORDER BY mr.created_at DESC LIMIT 20`,
        [patientId, tenantId],
      ),
      this.db.queryWithTenant(
        tenantId,
        `SELECT id, type, title, created_at FROM documents
         WHERE patient_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC LIMIT 10`,
        [patientId, tenantId],
      ),
      this.db.queryWithTenant(
        tenantId,
        `SELECT id, type, status, created_at FROM whatsapp_messages
         WHERE patient_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC LIMIT 10`,
        [patientId, tenantId],
      ),
    ]);

    return { appointments, medical_records: records, documents, whatsapp_messages: messages };
  }

  async getPreRegistrationData(token: string) {
    const patient = await this.db.queryOne(
      `SELECT p.id, p.full_name, p.phone, p.email, p.pre_registration_completed,
              t.name AS clinic_name, t.logo_url
       FROM patients p
       JOIN tenants t ON t.id = p.tenant_id
       WHERE p.pre_registration_token = $1`,
      [token],
    );
    if (!patient) throw new NotFoundException('Link inválido ou expirado');
    return patient;
  }

  async completePreRegistration(token: string, dto: any) {
    const patient = await this.db.queryOne(
      `UPDATE patients SET
         full_name        = COALESCE($2, full_name),
         cpf              = COALESCE($3, cpf),
         date_of_birth    = COALESCE($4, date_of_birth),
         address_street   = COALESCE($5, address_street),
         address_number   = COALESCE($6, address_number),
         address_city     = COALESCE($7, address_city),
         address_state    = COALESCE($8, address_state),
         insurance_name   = COALESCE($9, insurance_name),
         insurance_number = COALESCE($10, insurance_number),
         pre_registration_completed = true,
         updated_at = NOW()
       WHERE pre_registration_token = $1
       RETURNING id, full_name`,
      [
        token,
        dto.full_name ?? null,
        dto.cpf ?? null,
        dto.date_of_birth ?? null,
        dto.address_street ?? null,
        dto.address_number ?? null,
        dto.address_city ?? null,
        dto.address_state ?? null,
        dto.insurance_name ?? null,
        dto.insurance_number ?? null,
      ],
    );
    if (!patient) throw new NotFoundException('Token inválido');
    return { message: 'Pré-cadastro concluído com sucesso!', patient };
  }
}
