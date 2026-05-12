// ============================================================
// modules/dashboard/dashboard.service.ts
// ============================================================
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getExecutiveDashboard(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [todayStats, monthStats, topDoctors, noShowRate, recentPatients, upcoming] =
      await Promise.all([
        this.db.queryOneWithTenant(tenantId,
          `SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN status='completed'                            THEN 1 END) AS completed,
            COUNT(CASE WHEN status IN('scheduled','confirmed','waiting','in_progress') THEN 1 END) AS pending,
            COUNT(CASE WHEN status='no_show'  THEN 1 END) AS no_show,
            COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled
           FROM appointments
           WHERE tenant_id = $1
             AND DATE(scheduled_at AT TIME ZONE 'America/Sao_Paulo') = $2`,
          [tenantId, today],
        ),

        this.db.queryOneWithTenant(tenantId,
          `SELECT
            COALESCE(SUM(amount) FILTER (WHERE type='income' AND status='paid'), 0) AS revenue,
            (SELECT COUNT(*) FROM patients
             WHERE tenant_id = $1
               AND created_at >= DATE_TRUNC('month', NOW())) AS new_patients
           FROM transactions
           WHERE tenant_id = $1
             AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NOW())`,
          [tenantId],
        ),

        this.db.queryWithTenant(tenantId,
          `SELECT u.full_name, u.specialty,
            COUNT(a.id) AS total_appointments,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type='income' AND t.status='paid'), 0) AS revenue
           FROM users u
           LEFT JOIN appointments a ON a.doctor_id = u.id AND a.tenant_id = u.tenant_id
             AND DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())
           LEFT JOIN transactions t ON t.doctor_id = u.id AND t.tenant_id = u.tenant_id
             AND DATE_TRUNC('month', t.due_date) = DATE_TRUNC('month', NOW())
           WHERE u.tenant_id = $1 AND u.role = 'doctor' AND u.is_active = true
           GROUP BY u.id
           ORDER BY total_appointments DESC LIMIT 5`,
          [tenantId],
        ),

        this.db.queryOneWithTenant(tenantId,
          `SELECT ROUND(
            100.0 * COUNT(CASE WHEN status='no_show' THEN 1 END) /
            NULLIF(COUNT(CASE WHEN status IN('completed','no_show') THEN 1 END), 0),
          1) AS no_show_rate
           FROM appointments
           WHERE tenant_id = $1 AND scheduled_at >= NOW() - INTERVAL '30 days'`,
          [tenantId],
        ),

        this.db.queryWithTenant(tenantId,
          `SELECT id, full_name, phone, created_at FROM patients
           WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
           ORDER BY created_at DESC LIMIT 5`,
          [tenantId],
        ),

        this.db.queryWithTenant(tenantId,
          `SELECT a.id, a.scheduled_at, a.status, a.appointment_type,
                  p.full_name AS patient_name,
                  u.full_name AS doctor_name
           FROM appointments a
           JOIN patients p ON p.id = a.patient_id
           JOIN users u ON u.id = a.doctor_id
           WHERE a.tenant_id = $1
             AND a.scheduled_at > NOW()
             AND a.status IN ('scheduled','confirmed')
           ORDER BY a.scheduled_at ASC LIMIT 10`,
          [tenantId],
        ),
      ]);

    return {
      today: todayStats,
      month: monthStats,
      top_doctors: topDoctors,
      no_show_rate: noShowRate?.no_show_rate ?? 0,
      recent_patients: recentPatients,
      upcoming_appointments: upcoming,
    };
  }
}
