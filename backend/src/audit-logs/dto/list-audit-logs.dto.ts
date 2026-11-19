import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListAuditLogsDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 50;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  action?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  entityType?: string;
}
