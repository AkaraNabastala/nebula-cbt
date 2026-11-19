import { IsBoolean } from 'class-validator';

export class UpdateAssignmentStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
