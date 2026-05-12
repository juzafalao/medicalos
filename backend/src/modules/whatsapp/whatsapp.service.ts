import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger('WhatsappService');

  // Versão ÚNICA: Aceita os 3 argumentos que o seu processor exige
  async sendMessage(tenantId: string, to: string, message: string) {
    this.logger.log(`[Tenant ${tenantId}] Enviando para ${to}: ${message}`);
    return 'id_externo_simulado';
  }

  async queueMessage(tenantId: string, data: any) {
    this.logger.log(`[Tenant ${tenantId}] Mensagem colocada na fila para: ${data.to || data.patientId}`);
    return { success: true, jobId: 'job_123' };
  }

  async sendConfirmation(tenantId: string, appointmentId: string) {
    this.logger.log(`[Tenant ${tenantId}] Enviando confirmação do agendamento ${appointmentId}`);
    return { success: true };
  }

  async scheduleFollowup(tenantId: string, appointmentId: string) {
    this.logger.log(`Agendando follow-up para ${appointmentId}`);
    return { success: true };
  }

  async getTemplates(tenantId: string) {
    return [
      { id: '1', name: 'Confirmação', message: 'Olá, sua consulta está agendada.' },
      { id: '2', name: 'Recuperação', message: 'Sentimos sua falta! Vamos reagendar?' }
    ];
  }

  async updateTemplate(tenantId: string, id: string, message: string) {
    this.logger.log(`Template ${id} atualizado para o Tenant ${tenantId}`);
    return { success: true };
  }

  async getConversations(tenantId: string, page: number) {
    return { data: [], total: 0, page };
  }

  // Retorna 'sent' e 'processed' para satisfazer o scheduler
  async sendRecoveryMessages(tenantId: string) {
    this.logger.log(`Disparando campanha de recuperação para o Tenant ${tenantId}`);
    return { 
      success: true, 
      sent: 0, 
      processed: 0 
    }; 
  }
}