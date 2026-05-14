import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entities';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({
      reporter: { user_id: createReportDto.reporter_id },
      target_type: createReportDto.target_type,
      target_id: createReportDto.target_id,
      reason: createReportDto.reason,
    });

    return this.reportsRepository.save(report);
  }
}