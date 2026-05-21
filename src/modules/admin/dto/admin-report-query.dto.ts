import { IsEnum, IsOptional } from 'class-validator';
import {
  ReportStatus,
  ReportTargetType,
} from '../../reports/entities/report.entities';

export class AdminReportQueryDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;
}
