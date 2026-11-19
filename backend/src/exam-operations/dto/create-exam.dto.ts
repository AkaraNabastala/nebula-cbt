import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsUUID()
  assessmentTypeId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsUUID()
  subjectId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionName!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  classIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  questionIds!: string[];

  @IsBoolean()
  shuffleQuestions!: boolean;

  @IsBoolean()
  shuffleOptions!: boolean;
}
