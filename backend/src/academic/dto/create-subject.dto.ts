import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MaxLength(30)
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
