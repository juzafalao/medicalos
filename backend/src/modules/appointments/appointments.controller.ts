// ============================================================
// APPOINTMENTS CONTROLLER
// ============================================================
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly svc: AppointmentsService) {}

  @Get('by-date')
  @ApiOperation({ summary: 'Consultas de um dia específico' })
  byDate(
    @Query('date') date: string,
    @Query('doctorId') doctorId: string,
    @Req() req: any,
  ) {
    return this.svc.findByDate(req.user.tenant_id, date, doctorId);
  }

  @Get('range')
  @ApiOperation({ summary: 'Consultas por intervalo de datas' })
  byRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('doctorId') doctorId: string,
    @Req() req: any,
  ) {
    return this.svc.findByRange(req.user.tenant_id, startDate, endDate, doctorId);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Horários disponíveis de um médico em uma data' })
  availableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Req() req: any,
  ) {
    return this.svc.getAvailableSlots(req.user.tenant_id, doctorId, date);
  }

  @Post()
  @ApiOperation({ summary: 'Cria novo agendamento' })
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.create(req.user.tenant_id, dto, req.user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualiza status da consulta' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Req() req: any,
  ) {
    return this.svc.updateStatus(req.user.tenant_id, id, body.status, body.notes);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reagenda consulta' })
  reschedule(
    @Param('id') id: string,
    @Body() body: { scheduled_at: string },
    @Req() req: any,
  ) {
    return this.svc.reschedule(req.user.tenant_id, id, body.scheduled_at);
  }
}

// ============================================================
// appointments.module.ts (atualizado com controller)
// ============================================================
import { Module } from '@nestjs/common';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
