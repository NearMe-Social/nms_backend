import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../reports/entities/report.entities';
import { User } from '../users/entities/user.entity';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    return reports.map((report) => this.toAdminReportResponse(report));
  }

  async getReportDetail(reportId: number) {
    const report = await this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewedBy', 'reviewedBy')
      .where('report.report_id = :reportId', { reportId })
      .getOne();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.toAdminReportResponse(report);
  }

  async updateReportStatus(
    reportId: number,
    adminUserId: number,
    dto: UpdateReportStatusDto,
  ) {
    const report = await this.reportRepo.findOne({
      where: { report_id: reportId },
      relations: {
        reporter: true,
        reviewedBy: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = dto.status;
    report.moderator_note = dto.moderatorNote?.trim() || null;

    if (dto.status === ReportStatus.PENDING) {
      report.reviewed_at = null;
      report.reviewedBy = null;
    } else {
      const admin = await this.userRepo.findOne({
        where: { user_id: adminUserId },
      });

      if (!admin) {
        throw new NotFoundException('Admin user not found');
      }

      report.reviewed_at = new Date();
      report.reviewedBy = admin;
    }

    const savedReport = await this.reportRepo.save(report);

    return this.toAdminReportResponse(savedReport);
  }

  private toAdminReportResponse(report: Report) {
    return {
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
    };
  }
}
