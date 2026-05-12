import { Controller, Get, Post, Patch, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/index';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get()
  findAll(@Req() req: any) { return this.svc.findAll(req.user.tenant_id); }

  @Get('doctors')
  findDoctors(@Req() req: any) { return this.svc.findDoctors(req.user.tenant_id); }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) { return this.svc.findOne(req.user.tenant_id, id); }

  @Post()
  @Roles('admin')
  create(@Body() dto: any, @Req() req: any) { return this.svc.create(req.user.tenant_id, dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.svc.update(req.user.tenant_id, id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.svc.toggleActive(req.user.tenant_id, id);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body('password') password: string, @Req() req: any) {
    return this.svc.changePassword(req.user.tenant_id, id, password);
  }

  @Get(':id/schedule')
  getSchedule(@Param('id') id: string, @Req() req: any) {
    return this.svc.getDoctorSchedule(req.user.tenant_id, id);
  }

  @Post(':id/schedule')
  upsertSchedule(@Param('id') id: string, @Body() body: { schedule: any[] }, @Req() req: any) {
    return this.svc.upsertWorkingHours(req.user.tenant_id, id, body.schedule);
  }
}
