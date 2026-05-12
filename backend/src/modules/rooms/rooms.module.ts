// ============================================================
// ROOMS MODULE - Salas de atendimento
// ============================================================
import { Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DatabaseService } from '../../config/database.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class RoomsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(tenantId: string) {
    return this.db.queryWithTenant(
      tenantId,
      'SELECT * FROM rooms WHERE tenant_id = $1 ORDER BY name',
      [tenantId],
    );
  }

  async create(tenantId: string, dto: { name: string; description?: string }) {
    return this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO rooms (tenant_id, name, description) VALUES ($1,$2,$3) RETURNING *`,
      [tenantId, dto.name, dto.description],
    );
  }

  async update(tenantId: string, id: string, dto: { name?: string; description?: string; is_active?: boolean }) {
    const fields = Object.keys(dto).map((k, i) => `${k} = $${i + 3}`).join(', ');
    return this.db.queryOneWithTenant(
      tenantId,
      `UPDATE rooms SET ${fields} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, ...Object.values(dto)],
    );
  }

  async getBlockedSlots(tenantId: string, doctorId: string, date: string) {
    return this.db.queryWithTenant(
      tenantId,
      `SELECT * FROM blocked_slots
       WHERE tenant_id = $1 AND doctor_id = $2
         AND DATE(start_datetime) = $3`,
      [tenantId, doctorId, date],
    );
  }

  async createBlockedSlot(tenantId: string, dto: {
    doctor_id: string; start_datetime: string;
    end_datetime: string; reason?: string;
  }) {
    return this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO blocked_slots (tenant_id, doctor_id, start_datetime, end_datetime, reason)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tenantId, dto.doctor_id, dto.start_datetime, dto.end_datetime, dto.reason],
    );
  }

  async deleteBlockedSlot(tenantId: string, id: string) {
    await this.db.queryWithTenant(
      tenantId,
      'DELETE FROM blocked_slots WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return { message: 'Bloqueio removido' };
  }
}

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly svc: RoomsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.svc.findAll(req.user.tenant_id);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.create(req.user.tenant_id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.svc.update(req.user.tenant_id, id, dto);
  }

  @Get('blocked-slots')
  getBlockedSlots(
    @Query('doctor_id') doctorId: string,
    @Query('date') date: string,
    @Req() req: any,
  ) {
    return this.svc.getBlockedSlots(req.user.tenant_id, doctorId, date);
  }

  @Post('blocked-slots')
  createBlockedSlot(@Body() dto: any, @Req() req: any) {
    return this.svc.createBlockedSlot(req.user.tenant_id, dto);
  }

  @Patch('blocked-slots/:id/delete')
  deleteBlockedSlot(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteBlockedSlot(req.user.tenant_id, id);
  }
}

@Module({
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
