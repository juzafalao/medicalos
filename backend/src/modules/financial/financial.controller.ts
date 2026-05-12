import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FinancialService } from './financial.service';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly svc: FinancialService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Lista transações com filtros' })
  list(
    @Query('type') type: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: number,
    @Req() req: any,
  ) {
    return this.svc.getTransactions(req.user.tenant_id, { type, status, startDate, endDate, page });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do período' })
  summary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    return this.svc.getCashFlowSummary(req.user.tenant_id, startDate, endDate);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Cria lançamento financeiro' })
  create(@Body() dto: any, @Req() req: any) {
    return this.svc.createTransaction(req.user.tenant_id, dto, req.user.sub);
  }

  @Patch('transactions/:id/pay')
  @ApiOperation({ summary: 'Marca transação como paga' })
  markPaid(
    @Param('id') id: string,
    @Body() body: { payment_method: string },
    @Req() req: any,
  ) {
    return this.svc.markAsPaid(req.user.tenant_id, id, body.payment_method);
  }

  @Get('chart/monthly')
  @ApiOperation({ summary: 'Gráfico receita vs despesa mensal' })
  monthlyChart(@Query('year') year: string, @Req() req: any) {
    return this.svc.getMonthlyChart(req.user.tenant_id, year || String(new Date().getFullYear()));
  }

  @Get('commissions/:doctorId')
  @ApiOperation({ summary: 'Comissões/repasse de um médico' })
  commissions(
    @Param('doctorId') doctorId: string,
    @Query('month') month: string,
    @Req() req: any,
  ) {
    return this.svc.getDoctorCommissions(req.user.tenant_id, doctorId, month);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Categorias financeiras' })
  categories(@Req() req: any) {
    return req.db?.queryWithTenant(req.user.tenant_id,
      'SELECT * FROM financial_categories WHERE tenant_id = $1 AND is_active = true ORDER BY type, name',
      [req.user.tenant_id],
    );
  }
}