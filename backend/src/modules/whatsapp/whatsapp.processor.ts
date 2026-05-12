// ============================================================
// modules/whatsapp/whatsapp.processor.ts
// ============================================================
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { DatabaseService } from '../../config/database.service';

@Processor('whatsapp')
export class WhatsappProcessor {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly db: DatabaseService,
  ) {}

  @Process('send-message')
  async handleSendMessage(job: Job) {
    const {
      tenantId, phone, message, type,
      appointment_id, patient_id, template_id,
    } = job.data;

    try {
      const externalId = await this.whatsappService.sendMessage(
        tenantId, phone, message,
      );

      await this.db.queryWithTenant(
        tenantId,
        `INSERT INTO whatsapp_messages
           (tenant_id, patient_id, appointment_id, template_id,
            type, phone_to, message, status, external_message_id, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'sent',$8,NOW())`,
        [
          tenantId, patient_id ?? null, appointment_id ?? null,
          template_id ?? null, type, phone, message, externalId ?? null,
        ],
      );

      this.logger.log(`✅ WhatsApp [${type}] → ${phone}`);
    } catch (error: any) {
      this.logger.error(`❌ WhatsApp falhou → ${phone}: ${error.message}`);

      await this.db.queryWithTenant(
        tenantId,
        `INSERT INTO whatsapp_messages
           (tenant_id, patient_id, appointment_id, type,
            phone_to, message, status, error_message)
         VALUES ($1,$2,$3,$4,$5,$6,'failed',$7)`,
        [
          tenantId, patient_id ?? null, appointment_id ?? null,
          type, phone, message, error.message,
        ],
      );

      throw error; // Bull faz retry automático
    }
  }
}
