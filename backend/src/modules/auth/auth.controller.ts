import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService }       from './auth.service';
import { LoginDto }          from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { JwtAuthGuard }      from '../../common/guards/jwt-auth.guard';
import { Public }            from '../../common/decorators/index';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Post('register')
  @Public()
  register(@Body() dto: RegisterTenantDto) { return this.authService.registerTenant(dto); }

  @Post('refresh')
  @Public()
  refresh(@Body() body: { user_id: string; refresh_token: string }) {
    return this.authService.refreshToken(body.user_id, body.refresh_token);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: any) { return this.authService.logout(req.user.sub); }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) { return req.user; }
}
