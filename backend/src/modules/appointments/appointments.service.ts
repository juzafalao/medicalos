import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async findByDate(tenantId: string, date: string, doctorId?: string) {
    const doctorFilter = doctorId ? 'AND a.doctor_id = $3' : '';
    const params = doctorId ? [tenantId, date, doctorId] : [tenantId, date];

    return this.db.queryWithTenant(
      tenantId,
      `SELECT a.*, 
              p.full_name as patient_name, p.phone as patient_phone,
              p.whatsapp as patient_whatsapp, p.insurance_name,
              u.full_name as doctor_name, u.specialty as doctor_specialty,
              r.name as room_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users u ON u.id = a.doctor_id
       LEFT JOIN rooms r ON r.id = a.room_id
       WHERE a.tenant_id = $1 
         AND DATE(a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') = $2
         ${doctorFilter}
       ORDER BY a.scheduled_at ASC`,
      params,
    );
  }

  async findByRange(tenantId: string, startDate: string, endDate: string, doctorId?: string) {
    const doctorFilter = doctorId ? 'AND a.doctor_id = $4' : '';
    const params = doctorId 
      ? [tenantId, startDate, endDate, doctorId] 
      : [tenantId, startDate, endDate];

    return this.db.queryWithTenant(
      tenantId,
      `SELECT a.id, a.scheduled_at, a.duration_minutes, a.status,
              a.appointment_type, a.patient_id, a.doctor_id, a.room_id,
              p.full_name as patient_name,
              u.full_name as doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users u ON u.id = a.doctor_id
       WHERE a.tenant_id = $1 
         AND a.scheduled_at BETWEEN $2 AND $3
         ${doctorFilter}
       ORDER BY a.scheduled_at ASC`,
      params,
    );
  }

  async create(tenantId: string, dto: any, createdBy: string) {
    const conflict = await this.db.queryOneWithTenant(
      tenantId,
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND tenant_id = $2 
         AND status NOT IN ('cancelled', 'no_show')
         AND scheduled_at < $3::timestamptz + ($4 || ' minutes')::interval
         AND scheduled_at + (duration_minutes || ' minutes')::interval > $3::timestamptz`,
      [dto.doctor_id, tenantId, dto.scheduled_at, dto.duration_minutes || 30],
    );

    if (conflict) throw new ConflictException('Horário já ocupado para este profissional');

    const appointment = await this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO appointments (
        tenant_id, patient_id, doctor_id, room_id, scheduled_at,
        duration_minutes, appointment_type, reason, price,
        insurance_name, insurance_auth_code, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        tenantId, dto.patient_id, dto.doctor_id, dto.room_id, 
        dto.scheduled_at, dto.duration_minutes || 30, dto.appointment_type,
        dto.reason, dto.price, dto.insurance_name, dto.insurance_auth_code, createdBy,
      ],
    );

    this.whatsapp.sendConfirmation(tenantId, appointment.id).catch(() => {});
    return appointment;
  }

  async updateStatus(tenantId: string, id: string, status: string, notes?: string) {
    const appointment = await this.db.queryOneWithTenant(
      tenantId,
      `UPDATE appointments SET status = $3, notes = COALESCE($4, notes),
              ${status === 'cancelled' ? "cancelled_at = NOW()," : ''}
              updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, status, notes],
    );

    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    if (status === 'completed') {
      setTimeout(() => {
        this.whatsapp.scheduleFollowup(tenantId, id);
      }, 2 * 60 * 60 * 1000);
    }

    return appointment;
  }

  async reschedule(tenantId: string, id: string, newDateTime: string) {
    const appointment = await this.db.queryOneWithTenant(
      tenantId,
      `UPDATE appointments SET scheduled_at = $3, status = 'scheduled',
              confirmation_sent_at = NULL, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, newDateTime],
    );
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    this.whatsapp.sendConfirmation(tenantId, appointment.id).catch(() => {});
    return appointment;
  }

  async getAvailableSlots(tenantId: string, doctorId: string, date: string) {
    const dayOfWeek = new Date(date).getDay();
    const [workingHours, blockedSlots, existingAppointments] = await Promise.all([
      this.db.queryWithTenant(
        tenantId,
        `SELECT start_time, end_time, slot_duration FROM working_hours 
         WHERE doctor_id = $1 AND tenant_id = $2 AND day_of_week = $3 AND is_active = true`,
        [doctorId, tenantId, dayOfWeek],
      ),
      this.db.queryWithTenant(
        tenantId,
        `SELECT start_datetime, end_datetime FROM blocked_slots 
         WHERE doctor_id = $1 AND tenant_id = $2 
           AND DATE(start_datetime) = $3`,
        [doctorId, tenantId, date],
      ),
      this.db.queryWithTenant(
        tenantId,
        `SELECT scheduled_at, duration_minutes FROM appointments 
         WHERE doctor_id = $1 AND tenant_id = $2 
           AND DATE(scheduled_at AT TIME ZONE 'America/Sao_Paulo') = $3
           AND status NOT IN ('cancelled', 'no_show')`,
        [doctorId, tenantId, date],
      ),
    ]);

    if (!workingHours.length) return [];
    const slots: string[] = [];

    for (const wh of workingHours) {
      const slotDuration = wh.slot_duration;
      let current = new Date(`${date}T${wh.start_time}:00`);
      const end = new Date(`${date}T${wh.end_time}:00`);

      while (current < end) {
        const isBlocked = blockedSlots.some(
          (b: any) => current >= new Date(b.start_datetime) && current < new Date(b.end_datetime),
        );
        const isOccupied = existingAppointments.some((a: any) => {
          const apptStart = new Date(a.scheduled_at);
          const apptEnd = new Date(apptStart.getTime() + a.duration_minutes * 60000);
          return current >= apptStart && current < apptEnd;
        });

        if (!isBlocked && !isOccupied) {
          slots.push(current.toISOString());
        }
        current = new Date(current.getTime() + slotDuration * 60000);
      }
    }
    return slots;
  }
}