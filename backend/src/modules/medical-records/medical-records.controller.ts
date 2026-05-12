// ============================================================
// MEDICAL RECORDS CONTROLLER
// ============================================================
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MedicalRecordsService } from './medical-records.service';
import { DocumentsService } from './documents.service';

@ApiTags('medical-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecords: MedicalRecordsService,
    private readonly documents: DocumentsService,
  ) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Lista prontuários de um paciente' })
  findByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    return this.medicalRecords.findByPatient(
      req.user.tenant_id, patientId, req.user.sub, req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca prontuário completo por ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.medicalRecords.findOne(
      req.user.tenant_id, id, req.user.sub, req.user.role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cria novo prontuário' })
  create(@Body() dto: any, @Req() req: any) {
    return this.medicalRecords.create(req.user.tenant_id, dto, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza prontuário' })
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.medicalRecords.update(
      req.user.tenant_id, id, dto, req.user.sub, req.user.role,
    );
  }

  @Patch(':id/sign')
  @ApiOperation({ summary: 'Assina digitalmente o prontuário' })
  sign(@Param('id') id: string, @Req() req: any) {
    return this.medicalRecords.update(
      req.user.tenant_id, id, { is_signed: true }, req.user.sub, req.user.role,
    );
  }

  @Get('cid10/search')
  @ApiOperation({ summary: 'Busca CID-10' })
  searchCid10(@Query('q') query: string) {
    return this.medicalRecords.searchCid10(query);
  }

  @Get('doctor/stats')
  @ApiOperation({ summary: 'Estatísticas do médico logado' })
  myStats(@Req() req: any) {
    return this.medicalRecords.getDoctorStats(req.user.tenant_id, req.user.sub);
  }

  // ── Documentos
  @Post(':id/documents')
  @ApiOperation({ summary: 'Cria documento clínico (receita, atestado, etc)' })
  createDocument(@Param('id') recordId: string, @Body() dto: any, @Req() req: any) {
    return this.documents.createDocument(req.user.tenant_id, req.user.sub, {
      ...dto,
      medical_record_id: recordId,
    });
  }

  @Get('patient/:patientId/documents')
  @ApiOperation({ summary: 'Lista documentos do paciente' })
  getDocuments(@Param('patientId') patientId: string, @Req() req: any) {
    return this.documents.getPatientDocuments(req.user.tenant_id, patientId);
  }

  @Get('templates/documents')
  @ApiOperation({ summary: 'Lista templates de documentos disponíveis' })
  getTemplates(@Query('type') type: string, @Req() req: any) {
    return this.documents.getDocumentTemplates(req.user.tenant_id, type);
  }

  @Patch('documents/:docId/sign')
  @ApiOperation({ summary: 'Assina documento clínico' })
  signDocument(@Param('docId') docId: string, @Req() req: any) {
    return this.documents.signDocument(req.user.tenant_id, docId, req.user.sub);
  }
}
