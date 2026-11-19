import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  deviceFingerprint!: string;
}
