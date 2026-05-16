import { Module } from '@nestjs/common';
import { AdminController } from './adminReports.controller';
import { AdminService } from './adminReports.service';
import { Report } from '../reports/entities/report.entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}