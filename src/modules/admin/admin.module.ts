import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminUsersService } from './admin-users.service';
import { AdminContentService } from './admin-content.service';
import { AdminPermissionsService } from './admin-permissions.service';
import { AdminPermissionsController } from './admin-permissions.controller';
import { Comment } from '../comments/entities/comment.entities';
import { Post } from '../posts/entities/post.entities';
import { Report } from '../reports/entities/report.entities';
import { User } from '../users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post, Report, User])],
  providers: [AdminReportsService, AdminUsersService, AdminContentService, AdminPermissionsService],
  controllers: [
    AdminReportsController,
    AdminUsersController,
    AdminContentController,
    // permissions page
    AdminPermissionsController,
  ],
})
export class AdminModule {}
