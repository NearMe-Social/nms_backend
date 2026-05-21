import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../../reports/entities/report.entities';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  moderatorNote?: string;
}
