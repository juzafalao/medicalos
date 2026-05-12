// ============================================================
// common/guards/roles.guard.ts
// ============================================================
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem decorator @Roles → qualquer autenticado pode acessar
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Acesso negado. Perfil necessário: ${required.join(' ou ')}`,
      );
    }
    return true;
  }
}
