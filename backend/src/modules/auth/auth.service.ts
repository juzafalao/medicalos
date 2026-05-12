import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../config/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string, tenantSlug: string) {
    const tenant = await this.db.queryOne(
      'SELECT id, is_active FROM tenants WHERE slug = $1',
      [tenantSlug],
    );
    if (!tenant || !tenant.is_active) {
      throw new UnauthorizedException('Clínica não encontrada ou inativa');
    }

    const user = await this.db.queryOne(
      `SELECT id, tenant_id, email, password_hash, full_name, role, is_active
       FROM users WHERE email = $1 AND tenant_id = $2`,
      [email.toLowerCase(), tenant.id],
    );

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Credenciais inválidas');

    return { ...user, tenant };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password, dto.tenant_slug);

    const payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    };

    const access_token = this.jwt.sign(payload);
    const refresh_token = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const refreshHash = await bcrypt.hash(refresh_token, 10);
    await this.db.query(
      'UPDATE users SET refresh_token = $1, last_login_at = NOW() WHERE id = $2',
      [refreshHash, user.id],
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    };
  }

  // MÉTODO EXIGIDO PELO ERRO: refreshToken
  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.db.queryOne(
      'SELECT id, tenant_id, email, role, refresh_token FROM users WHERE id = $1',
      [userId],
    );

    if (!user?.refresh_token) throw new UnauthorizedException();

    const isValid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!isValid) throw new UnauthorizedException('Refresh token inválido');

    const payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    };

    return { access_token: this.jwt.sign(payload) };
  }

  // MÉTODO EXIGIDO PELO ERRO: logout
  async logout(userId: string) {
    await this.db.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [userId],
    );
    return { message: 'Logout realizado com sucesso' };
  }

  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.db.queryOne(
      'SELECT id FROM tenants WHERE slug = $1 OR email = $2',
      [dto.slug, dto.email],
    );
    if (existing) throw new BadRequestException('Clínica ou email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.db.transactionWithTenant('00000000-0000-0000-0000-000000000000', async (client) => {
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, email, phone, cnpj)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [dto.clinic_name, dto.slug, dto.email, dto.phone, dto.cnpj],
      );
      const tenantId = tenantResult.rows[0].id;

      await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [tenantId, dto.email.toLowerCase(), passwordHash, dto.full_name],
      );

      const defaultCategories = [
        ['Consulta Particular', 'income', '#10B981'],
        ['Consulta Convênio', 'income', '#3B82F6'],
        ['Procedimento', 'income', '#8B5CF6'],
        ['Aluguel', 'expense', '#EF4444'],
        ['Salários', 'expense', '#F97316'],
        ['Repasse Médico', 'expense', '#0EA5E9'],
      ];
      
      for (const [name, type, color] of defaultCategories) {
        await client.query(
          `INSERT INTO financial_categories (tenant_id, name, type, color)
           VALUES ($1, $2, $3, $4)`,
          [tenantId, name, type, color],
        );
      }

      return {
        message: 'Clínica cadastrada com sucesso!',
        tenant_id: tenantId,
        slug: dto.slug,
      };
    });
  }
}