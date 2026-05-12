// ============================================================
// modules/auth/dto/register-tenant.dto.ts
// ============================================================
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Clínica São Lucas' })
  @IsString()
  @MinLength(2)
  clinic_name: string;

  @ApiProperty({ example: 'clinica-sao-lucas', description: 'Identificador único sem espaços' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug: apenas letras minúsculas, números e hífens' })
  slug: string;

  @ApiProperty({ example: 'admin@clinica.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Dr. João Silva' })
  @IsString()
  @MinLength(2)
  full_name: string;

  @ApiProperty({ example: 'senha123456' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @ApiProperty({ required: false, example: '(11) 99999-0000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '00.000.000/0001-00' })
  @IsOptional()
  @IsString()
  cnpj?: string;
}
