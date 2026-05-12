import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

// Forçamos o token como uma string exata
export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'PG_POOL', // Usando a string diretamente aqui
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Pool({
          user: config.get<string>('DB_USER'),
          host: config.get<string>('DB_HOST'),
          database: config.get<string>('DB_NAME'),
          password: config.get<string>('DB_PASSWORD'),
          port: config.get<number>('DB_PORT', 5432),
        });
      },
    },
    DatabaseService,
  ],
  exports: ['PG_POOL', DatabaseService], // Exportamos a string e o serviço
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
  }
}