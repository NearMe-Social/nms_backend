import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entities';
import { AdminReportQueryDto } from './dto/adminReports.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async getReportList(query: AdminReportQueryDto) {
    const qb = this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewedBy', 'reviewedBy')
      .orderBy('report.created_at', 'DESC');

    if (query.status) {
      qb.andWhere('report.status = :status', {
        status: query.status,
      });
    }

    if (query.targetType) {
      qb.andWhere('report.target_type = :targetType', {
        targetType: query.targetType,
      });
    }

    const reports = await qb.getMany();

    return reports.map((report) => ({
      reportId: report.report_id,
      reporter: report.reporter
        ? {
            userId: report.reporter.user_id,
            username: report.reporter.username,
            email: report.reporter.email,
          }
        : null,
      targetType: report.target_type,
      targetId: report.target_id,
      reason: report.reason,
      status: report.status,
      reviewedBy: report.reviewedBy
        ? {
            userId: report.reviewedBy.user_id,
            username: report.reviewedBy.username,
          }
        : null,
      reviewedAt: report.reviewed_at,
      moderatorNote: report.moderator_note,
      createdAt: report.created_at,
    }));
  }
}
