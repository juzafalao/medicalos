import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../config/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, dto: any) {
    const existing = await this.db.queryOne(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [dto.email.toLowerCase(), tenantId],
    );
    if (existing) throw new BadRequestException('Email já cadastrado nesta clínica');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result: any = await this.db.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, specialty, crm)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, role`,
      [tenantId, dto.email.toLowerCase(), passwordHash, dto.full_name, dto.role, dto.specialty, dto.crm],
    );

    return result.rows ? result.rows[0] : result[0];
  }

  async findAll(tenantId: string) {
    const result: any = await this.db.query(
      `SELECT id, email, full_name, role, specialty, crm, is_active, last_login_at 
       FROM users WHERE tenant_id = $1 ORDER BY full_name`,
      [tenantId],
    );
    return result.rows || result;
  }

  // MÉTODO ADICIONADO: Busca apenas médicos
  async findDoctors(tenantId: string) {
    const result: any = await this.db.query(
      `SELECT id, full_name, specialty, crm FROM users 
       WHERE tenant_id = $1 AND role = 'doctor' AND is_active = true ORDER BY full_name`,
      [tenantId],
    );
    return result.rows || result;
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.db.queryOne(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(tenantId: string, id: string, dto: any) {
    const user = await this.findOne(tenantId, id);
    let passwordHash = user.password_hash;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const result: any = await this.db.query(
      `UPDATE users 
       SET full_name = $1, role = $2, specialty = $3, crm = $4, is_active = $5, password_hash = $6
       WHERE id = $7 AND tenant_id = $8 RETURNING id, email, full_name`,
      [
        dto.full_name || user.full_name,
        dto.role || user.role,
        dto.specialty || user.specialty,
        dto.crm || user.crm,
        dto.is_active !== undefined ? dto.is_active : user.is_active,
        passwordHash,
        id,
        tenantId,
      ],
    );
    return result.rows ? result.rows[0] : result[0];
  }

  // MÉTODO ADICIONADO: Alternar status ativo/inativo
  async toggleActive(tenantId: string, id: string) {
    const result: any = await this.db.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 AND tenant_id = $2 RETURNING is_active',
      [id, tenantId],
    );
    return result.rows ? result.rows[0] : result[0];
  }

  // MÉTODO ADICIONADO: Trocar senha
  async changePassword(tenantId: string, id: string, password: any) {
    const hash = await bcrypt.hash(password, 10);
    await this.db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3',
      [hash, id, tenantId],
    );
    return { message: 'Senha alterada com sucesso' };
  }

  // MÉTODOS DE AGENDA (PLACEHOLDERS para o Controller não quebrar)
  async getDoctorSchedule(tenantId: string, userId: string) {
    const result: any = await this.db.query(
      'SELECT * FROM doctor_schedules WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId],
    );
    return result.rows || result;
  }

  async upsertWorkingHours(tenantId: string, userId: string, schedule: any) {
    // Lógica simplificada de insert/update
    await this.db.query(
      'DELETE FROM doctor_schedules WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId],
    );
    const result: any = await this.db.query(
      'INSERT INTO doctor_schedules (tenant_id, user_id, schedule) VALUES ($1, $2, $3) RETURNING *',
      [tenantId, userId, JSON.stringify(schedule)],
    );
    return result.rows ? result.rows[0] : result[0];
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return { message: 'Usuário removido com sucesso' };
  }
}