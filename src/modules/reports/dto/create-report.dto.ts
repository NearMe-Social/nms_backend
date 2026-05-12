import { IsEnum, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ReportTargetType } from '../entities/report.entities';

export class CreateReportDto {
  @IsEnum(ReportTargetType, {
    message: `target_type must be one of: ${Object.values(ReportTargetType).join(', ')}`,
  })
  @IsNotEmpty()
  target_type: ReportTargetType;

  @IsInt()
  @IsNotEmpty()
  target_id: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'reason must be at least 10 characters long' })
  reason: string;
}