import {
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @IsIn(['EMAIL', 'USERNAME'])
  identifierType!: 'EMAIL' | 'USERNAME';

  @IsString()
  @MinLength(3)
  @MaxLength(191)
  identifier!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn(['ADMIN', 'TEACHER', 'STUDENT'])
  roleCode!: 'ADMIN' | 'TEACHER' | 'STUDENT';
}
