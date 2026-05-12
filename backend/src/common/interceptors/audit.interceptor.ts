// ============================================================
// common/interceptors/audit.interceptor.ts
// ============================================================
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req   = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms     = Date.now() - start;
        const user   = req.user;
        const tenant = user?.tenant_id?.slice(0, 8) ?? 'anon';
        const email  = user?.email ?? 'anon';

        this.logger.log(
          `[${tenant}] ${email} | ${req.method} ${req.url} +${ms}ms`,
        );
      }),
    );
  }
}
