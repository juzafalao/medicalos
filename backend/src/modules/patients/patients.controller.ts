import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { Public } from '../../common/decorators/index';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly svc: PatientsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    return this.svc.findAll(req.user.tenant_id, +page, +limit, search);
  }

  @Get('pre-registration/:token')
  @Public()
  getPreRegistration(@Param('token') token: string) {
    return this.svc.getPreRegistrationData(token);
  }

  @Post('pre-registration/:token')
  @Public()
  completePreRegistration(@Param('token') token: string, @Body() dto: any) {
    return this.svc.completePreRegistration(token, dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.svc.findOne(req.user.tenant_id, id);
  }

  @Get(':id/timeline')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  timeline(@Param('id') id: string, @Req() req: any) {
    return this.svc.getTimeline(req.user.tenant_id, id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.create(req.user.tenant_id, dto, req.user.sub);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.svc.update(req.user.tenant_id, id, dto);
  }
}
