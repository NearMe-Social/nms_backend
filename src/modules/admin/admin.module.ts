import { Module } from '@nestjs/common';
import { AdminController } from './adminReports.controller';
import { AdminService } from './adminReports.service';

@Module({
  imports: [],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}