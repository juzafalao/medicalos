import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../../common/decorators/index';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly svc: WhatsappService) {}

  @Get('templates')
  getTemplates(@Req() req: any) { return this.svc.getTemplates(req.user.tenant_id); }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: { message: string }, @Req() req: any) {
    return this.svc.updateTemplate(req.user.tenant_id, id, body.message);
  }

  @Get('conversations')
  conversations(@Query('page') page = 1, @Req() req: any) {
    return this.svc.getConversations(req.user.tenant_id, +page);
  }

  @Post('send')
  @ApiOperation({ summary: 'Envio manual de mensagem WhatsApp' })
  sendManual(@Body() body: { phone: string; message: string; patient_id?: string }, @Req() req: any) {
    return this.svc.queueMessage(req.user.tenant_id, { ...body, type: 'other' });
  }

  @Post('recovery')
  @ApiOperation({ summary: 'Dispara campanha de recuperação de inativos' })
  triggerRecovery(@Req() req: any) { return this.svc.sendRecoveryMessages(req.user.tenant_id); }

  @Post('confirmation/:appointmentId')
  sendConfirmation(@Param('appointmentId') id: string, @Req() req: any) {
    return this.svc.sendConfirmation(req.user.tenant_id, id);
  }

  @Post('webhook/status')
  @Public()
  async webhookStatus(@Body() body: any) {
    const externalId = body.MessageSid || body.id;
    const rawStatus  = body.MessageStatus || body.event;
    const map: Record<string, string> = {
      sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed',
    };
    if (externalId && map[rawStatus]) {
      await (this.svc as any).db.query(
        `UPDATE whatsapp_messages SET status = $2,
          delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END,
          read_at      = CASE WHEN $2 = 'read'      THEN NOW() ELSE read_at END
         WHERE external_message_id = $1`,
        [externalId, map[rawStatus]],
      ).catch(() => {});
    }
    return { ok: true };
  }
}
