// ============================================================
// modules/financial/financial.service.ts  (arquivo isolado)
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class FinancialService {
  constructor(private readonly db: DatabaseService) {}

  async getTransactions(
    tenantId: string,
    filters: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
    },
  ) {
    const conditions: string[] = ['t.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.type)      { conditions.push(`t.type = $${idx++}`);       params.push(filters.type); }
    if (filters.status)    { conditions.push(`t.status = $${idx++}`);     params.push(filters.status); }
    if (filters.startDate) { conditions.push(`t.due_date >= $${idx++}`);  params.push(filters.startDate); }
    if (filters.endDate)   { conditions.push(`t.due_date <= $${idx++}`);  params.push(filters.endDate); }

    const { limit, offset } = this.db.buildPaginationQuery(filters.page ?? 1);
    params.push(limit, offset);

    const [transactions, summary] = await Promise.all([
      this.db.queryWithTenant(
        tenantId,
        `SELECT t.*,
                fc.name as category_name, fc.color as category_color,
                p.full_name as patient_name,
                u.full_name as doctor_name
         FROM transactions t
         LEFT JOIN financial_categories fc ON fc.id = t.category_id
         LEFT JOIN patients p ON p.id = t.patient_id
         LEFT JOIN users u ON u.id = t.doctor_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.due_date DESC, t.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        params,
      ),
      this.getCashFlowSummary(tenantId, filters.startDate, filters.endDate),
    ]);

    return { transactions, summary };
  }

  async getCashFlowSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const hasDateFilter = startDate && endDate;
    const params: any[] = [tenantId];
    let dateFilter: string;

    if (hasDateFilter) {
      params.push(startDate, endDate);
      dateFilter = `AND due_date BETWEEN $2 AND $3`;
    } else {
      dateFilter = `AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NOW())`;
    }

    const result = await this.db.queryOneWithTenant(
      tenantId,
      `SELECT
        COALESCE(SUM(CASE WHEN type='income'  AND status='paid'    THEN amount END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' AND status='paid'    THEN amount END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type='income'  AND status='pending' THEN amount END), 0) AS pending_income,
        COALESCE(SUM(CASE WHEN type='expense' AND status='pending' THEN amount END), 0) AS pending_expense,
        COALESCE(SUM(CASE WHEN type='income'  AND status='overdue' THEN amount END), 0) AS overdue_income
       FROM transactions
       WHERE tenant_id = $1 ${dateFilter}`,
      params,
    );

    const income  = parseFloat(result?.total_income  ?? '0');
    const expense = parseFloat(result?.total_expense ?? '0');

    return { ...result, balance: income - expense };
  }

  async createTransaction(tenantId: string, dto: any, createdBy: string) {
    return this.db.queryOneWithTenant(
      tenantId,
      `INSERT INTO transactions (
         tenant_id, appointment_id, patient_id, doctor_id, category_id,
         type, description, amount, payment_method, status, due_date,
         is_commission, commission_percentage, notes, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        tenantId, dto.appointment_id ?? null, dto.patient_id ?? null,
        dto.doctor_id ?? null, dto.category_id ?? null,
        dto.type, dto.description, dto.amount,
        dto.payment_method ?? null, dto.status ?? 'pending',
        dto.due_date ?? new Date().toISOString().split('T')[0],
        dto.is_commission ?? false, dto.commission_percentage ?? null,
        dto.notes ?? null, createdBy,
      ],
    );
  }

  async markAsPaid(tenantId: string, id: string, paymentMethod: string) {
    const tx = await this.db.queryOneWithTenant(
      tenantId,
      `UPDATE transactions
         SET status = 'paid', paid_at = NOW(),
             payment_method = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, paymentMethod],
    );
    if (!tx) throw new NotFoundException('Transação não encontrada');
    return tx;
  }

  async getDoctorCommissions(
    tenantId: string,
    doctorId: string,
    month: string,
  ) {
    return this.db.queryWithTenant(
      tenantId,
      `SELECT t.*, p.full_name as patient_name, a.scheduled_at
       FROM transactions t
       LEFT JOIN patients p ON p.id = t.patient_id
       LEFT JOIN appointments a ON a.id = t.appointment_id
       WHERE t.tenant_id = $1 AND t.doctor_id = $2
         AND t.is_commission = true
         AND TO_CHAR(t.due_date, 'YYYY-MM') = $3
       ORDER BY t.due_date DESC`,
      [tenantId, doctorId, month],
    );
  }

  async getMonthlyChart(tenantId: string, year: string) {
    return this.db.queryWithTenant(
      tenantId,
      `SELECT
         TO_CHAR(due_date, 'YYYY-MM') AS month,
         COALESCE(SUM(CASE WHEN type='income'  AND status='paid' THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type='expense' AND status='paid' THEN amount END), 0) AS expense
       FROM transactions
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM due_date) = $2
       GROUP BY TO_CHAR(due_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [tenantId, year],
    );
  }

  async getCategories(tenantId: string) {
    return this.db.queryWithTenant(
      tenantId,
      `SELECT * FROM financial_categories
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY type, name`,
      [tenantId],
    );
  }
}
