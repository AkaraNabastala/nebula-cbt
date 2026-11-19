import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  gradeLevel!: number;

  @IsUUID()
  academicYearId!: string;

  @IsUUID()
  @IsOptional()
  homeroomTeacherId?: string;
}
