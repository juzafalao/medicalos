import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // Executa query simples
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  // Executa query retornando primeira linha
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  // Executa query com tenant_id injetado via SET LOCAL (RLS)
  async queryWithTenant<T = any>(
    tenantId: string,
    sql: string,
    params?: any[],
  ): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
      const result = await client.query(sql, params);
      await client.query('COMMIT');
      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Executa uma única query com tenant retornando primeira linha
  async queryOneWithTenant<T = any>(
    tenantId: string,
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.queryWithTenant<T>(tenantId, sql, params);
    return rows[0] || null;
  }

  // Transação completa com tenant
  async transactionWithTenant<T>(
    tenantId: string,
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Transação sem contexto de tenant (para operações de bootstrap como registro)
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // MÉTODO RESTAURADO: Helper para paginação
  buildPaginationQuery(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return { limit, offset };
  }

  // MÉTODO RESTAURADO: Health check do banco
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}