import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttemptAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsObject()
  answerData!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  @IsOptional()
  answerVersion?: number;
}

export class SyncAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientBatchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerDto)
  answers!: AttemptAnswerDto[];
}
