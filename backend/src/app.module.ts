import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { DatabaseModule }       from './config/database.module';
import { AuthModule }           from './modules/auth/auth.module';
import { UsersModule }          from './modules/users/users.module';
import { TenantsModule }        from './modules/tenants/tenants.module';
import { PatientsModule }       from './modules/patients/patients.module';
import { AppointmentsModule }   from './modules/appointments/appointments.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { WhatsappModule }       from './modules/whatsapp/whatsapp.module';
import { FinancialModule }      from './modules/financial/financial.module';
import { DashboardModule }      from './modules/dashboard/dashboard.module';
import { RoomsModule }          from './modules/rooms/rooms.module';

import { JwtAuthGuard }         from './common/guards/jwt-auth.guard';
import { RolesGuard }           from './common/guards/roles.guard';
import { HttpExceptionFilter }  from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor }     from './common/interceptors/audit.interceptor';
import { AutomationScheduler }  from './modules/whatsapp/automation.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000,  limit: 30  },
      { name: 'long',  ttl: 60000, limit: 200 },
    ]),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host:     config.get('REDIS_HOST', 'localhost'),
          port:     config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    WhatsappModule,
    FinancialModule,
    DashboardModule,
    RoomsModule,
  ],
  providers: [
    AutomationScheduler,
    { provide: APP_GUARD,       useClass: JwtAuthGuard },
    { provide: APP_GUARD,       useClass: RolesGuard  },
    { provide: APP_FILTER,      useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
