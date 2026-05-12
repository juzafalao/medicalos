import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard executivo — KPIs em tempo real' })
  executive(@Req() req: any) {
    return this.svc.getExecutiveDashboard(req.user.tenant_id);
  }
}
