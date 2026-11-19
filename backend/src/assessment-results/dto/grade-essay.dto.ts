import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GradeEssayDto {
  @IsNumber()
  @Min(0)
  @Max(1000)
  score!: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  feedback?: string;
}
