import { IsIn } from 'class-validator';

export class UpdateQuestionStatusDto {
  @IsIn(['DRAFT', 'REVIEWED', 'PUBLISHED', 'ARCHIVED'])
  status!: 'DRAFT' | 'REVIEWED' | 'PUBLISHED' | 'ARCHIVED';
}
