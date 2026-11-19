import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'] as const;

class QuestionOptionDto {
  @IsString()
  @MaxLength(20)
  label!: string;

  @IsString()
  @MaxLength(2000)
  text!: string;
}

export class CreateQuestionDto {
  @IsIn(QUESTION_TYPES)
  type!: (typeof QUESTION_TYPES)[number];

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @IsString()
  @MaxLength(10000)
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  explanation?: string;

  @IsNumber()
  @Min(0.01)
  @Max(1000)
  points!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  correctLabels?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptedAnswers?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  gradingGuide?: string;
}
