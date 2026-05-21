import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStatus } from '../comments/entities/comment.entities';
import { Post, PostStatus } from '../posts/entities/post.entities';
import {
  Report,
  ReportTargetType,
} from '../reports/entities/report.entities';
import { User } from '../users/entities/user.entity';
import {
  AdminContentAction,
  AdminContentTargetType,
} from './dto/content-action.dto';

@Injectable()
export class AdminContentService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getFlaggedContent() {
    const reports = await this.reportRepo.find({
      relations: {
        reporter: true,
        reviewedBy: true,
      },
      order: { created_at: 'DESC' },
    });

    return Promise.all(
      reports.map(async (report) => ({
        report: this.toReportSummary(report),
        target: await this.getTargetSnapshot(report.target_type, report.target_id),
      })),
    );
  }

  async updateContentStatus(
    targetType: AdminContentTargetType,
    targetId: number,
    action: AdminContentAction,
  ) {
    if (!Object.values(AdminContentTargetType).includes(targetType)) {
      throw new BadRequestException('Unsupported content target type');
    }

    if (!Object.values(AdminContentAction).includes(action)) {
      throw new BadRequestException('Unsupported content action');
    }

    if (targetType === AdminContentTargetType.POST) {
      const post = await this.postRepo.findOne({
        where: { post_id: targetId },
        relations: { user: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      post.status =
        action === AdminContentAction.RESTORE
          ? PostStatus.ACTIVE
          : PostStatus.REMOVED;

      const savedPost = await this.postRepo.save(post);

      return this.toPostSnapshot(savedPost);
    }

    if (targetType === AdminContentTargetType.COMMENT) {
      const comment = await this.commentRepo.findOne({
        where: { comment_id: targetId },
        relations: { user: true, post: true },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      comment.status =
        action === AdminContentAction.RESTORE
          ? CommentStatus.ACTIVE
          : CommentStatus.REMOVED;

      const savedComment = await this.commentRepo.save(comment);

      return this.toCommentSnapshot(savedComment);
    }

    throw new BadRequestException('Private chat messages cannot be moderated through admin content actions');
  }

  private async getTargetSnapshot(targetType: ReportTargetType, targetId: number) {
    if (targetType === ReportTargetType.POST) {
      const post = await this.postRepo.findOne({
        where: { post_id: targetId },
        relations: { user: true },
      });

      return post ? this.toPostSnapshot(post) : null;
    }

    if (targetType === ReportTargetType.COMMENT) {
      const comment = await this.commentRepo.findOne({
        where: { comment_id: targetId },
        relations: { user: true, post: true },
      });

      return comment ? this.toCommentSnapshot(comment) : null;
    }

    if (targetType === ReportTargetType.MESSAGE) {
      return {
        type: ReportTargetType.MESSAGE,
        id: targetId,
        content: null,
        note: 'Private message content is hidden from admin flagged-content snapshots.',
      };
    }

    const user = await this.userRepo.findOne({
      where: { user_id: targetId },
    });

    return user ? this.toUserSnapshot(user) : null;
  }

  private toReportSummary(report: Report) {
    return {
      reportId: report.report_id,
      targetType: report.target_type,
      targetId: report.target_id,
      reason: report.reason,
      status: report.status,
      reporter: report.reporter
        ? {
            userId: report.reporter.user_id,
            username: report.reporter.username,
            email: report.reporter.email,
          }
        : null,
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

  private toPostSnapshot(post: Post) {
    return {
      type: AdminContentTargetType.POST,
      id: post.post_id,
      title: post.title,
      content: post.content,
      status: post.status,
      author: post.user
        ? {
            userId: post.user.user_id,
            username: post.user.username,
          }
        : null,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }

  private toCommentSnapshot(comment: Comment) {
    return {
      type: AdminContentTargetType.COMMENT,
      id: comment.comment_id,
      content: comment.content,
      status: comment.status,
      postId: comment.post?.post_id ?? null,
      author: comment.user
        ? {
            userId: comment.user.user_id,
            username: comment.user.username,
          }
        : null,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };
  }

  private toUserSnapshot(user: User) {
    return {
      type: ReportTargetType.USER,
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }
}
