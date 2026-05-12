import { Controller, Get, Patch, Post, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @Get('me')
  getMe(@Req() req: any) { return this.svc.findById(req.user.tenant_id); }

  @Patch('me')
  update(@Body() dto: any, @Req() req: any) { return this.svc.update(req.user.tenant_id, dto); }

  @Post('me/whatsapp')
  configureWhatsapp(@Body() dto: any, @Req() req: any) {
    return this.svc.configureWhatsapp(req.user.tenant_id, dto);
  }

  @Get('me/stats')
  getStats(@Req() req: any) { return this.svc.getStats(req.user.tenant_id); }

  @Get('patients/:patientId/export')
  @ApiOperation({ summary: 'LGPD — Exporta todos os dados de um paciente' })
  exportPatient(@Param('patientId') id: string, @Req() req: any) {
    return this.svc.exportPatientData(req.user.tenant_id, id);
  }

  @Post('patients/:patientId/anonymize')
  @ApiOperation({ summary: 'LGPD — Anonimiza dados pessoais do paciente' })
  anonymize(@Param('patientId') id: string, @Req() req: any) {
    return this.svc.anonymizePatient(req.user.tenant_id, id);
  }
}
