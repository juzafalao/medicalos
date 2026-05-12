// ============================================================
// CRON JOBS - Automação de disparos WhatsApp
// ============================================================
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../../config/database.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AutomationScheduler {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly whatsapp: WhatsappService,
  ) {}

  // Confirmação 24h antes - roda a cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async sendConfirmations() {
    this.logger.log('Rodando job: confirmações de consultas 24h antes');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    const appointments = await this.db.query(
      `SELECT a.id, a.tenant_id FROM appointments a
       WHERE a.scheduled_at BETWEEN $1 AND $2
         AND a.status IN ('scheduled', 'confirmed')
         AND a.confirmation_sent_at IS NULL`,
      [start, end],
    );

    for (const appt of appointments) {
      await this.whatsapp.sendConfirmation(appt.tenant_id, appt.id);
    }

    this.logger.log(`Confirmações enviadas: ${appointments.length}`);
  }

  // Lembrete 2h antes - roda a cada 30 minutos
  @Cron('*/30 * * * *')
  async sendReminders() {
    this.logger.log('Rodando job: lembretes 2h antes');

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const windowStart = new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000);

    const appointments = await this.db.query(
      `SELECT a.id, a.tenant_id, a.scheduled_at,
              p.full_name as patient_name, p.whatsapp as patient_phone,
              u.full_name as doctor_name, t.name as clinic_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users u ON u.id = a.doctor_id
       JOIN tenants t ON t.id = a.tenant_id
       WHERE a.scheduled_at BETWEEN $1 AND $2
         AND a.status IN ('scheduled', 'confirmed')
         AND a.reminder_sent_at IS NULL
         AND p.whatsapp IS NOT NULL`,
      [windowStart.toISOString(), windowEnd.toISOString()],
    );

    for (const appt of appointments) {
      const template = await this.db.queryOneWithTenant(
        appt.tenant_id,
        `SELECT message FROM whatsapp_templates
         WHERE tenant_id = $1 AND type = 'reminder' AND is_active = true LIMIT 1`,
        [appt.tenant_id],
      );
      if (!template) continue;

      const scheduledDate = new Date(appt.scheduled_at);
      const message = template.message
        .replace('{{patient_name}}', appt.patient_name)
        .replace('{{doctor_name}}', appt.doctor_name)
        .replace('{{appointment_time}}', scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace('{{clinic_address}}', appt.clinic_name);

      await this.whatsapp.queueMessage(appt.tenant_id, {
        appointment_id: appt.id,
        phone: appt.patient_phone,
        message,
        type: 'reminder',
      });

      await this.db.query(
        'UPDATE appointments SET reminder_sent_at = NOW() WHERE id = $1',
        [appt.id],
      );
    }

    this.logger.log(`Lembretes enviados: ${appointments.length}`);
  }

  // Recuperação de inativos - roda uma vez por semana (segunda-feira 9h)
  @Cron('0 9 * * 1')
  async recoverInactivePatients() {
    this.logger.log('Rodando job: recuperação de pacientes inativos');

    const activeTenants = await this.db.query(
      `SELECT id FROM tenants WHERE is_active = true
       AND subscription_status IN ('active', 'trial')`,
    );

    let totalSent = 0;
    for (const tenant of activeTenants) {
      const result = await this.whatsapp.sendRecoveryMessages(tenant.id);
      totalSent += result.processed;
    }

    this.logger.log(`Recuperação: ${totalSent} mensagens agendadas`);
  }

  // Marcar no-show automaticamente - roda a cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async markNoShows() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await this.db.query(
      `UPDATE appointments SET status = 'no_show', updated_at = NOW()
       WHERE scheduled_at < $1
         AND status IN ('scheduled', 'confirmed')`,
      [oneHourAgo.toISOString()],
    );
  }

  // Atualizar last_appointment_at nos pacientes diariamente
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updatePatientLastAppointment() {
    await this.db.query(
      `UPDATE patients p SET last_appointment_at = (
         SELECT MAX(scheduled_at) FROM appointments a
         WHERE a.patient_id = p.id AND a.status = 'completed'
       ) WHERE EXISTS (
         SELECT 1 FROM appointments a
         WHERE a.patient_id = p.id AND a.status = 'completed'
       )`,
    );
  }
}
