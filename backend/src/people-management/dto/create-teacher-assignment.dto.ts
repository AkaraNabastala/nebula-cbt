import { IsUUID } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @IsUUID()
  teacherProfileId!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  classId!: string;
}
