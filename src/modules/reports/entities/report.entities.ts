import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
}

export enum ReportTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER',
  MESSAGE = 'MESSAGE',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  report_id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Column({
    type: 'enum',
    enum: ReportTargetType,
  })
  target_type!: ReportTargetType;

  @Column()
  target_id!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @ManyToOne(() => User, (user) => user.reviewedReports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy!: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at!: Date;

  @Column({ type: 'text', nullable: true })
  moderator_note!: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
