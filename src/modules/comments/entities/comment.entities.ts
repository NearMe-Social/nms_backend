import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum CommentStatus {
  ACTIVE = 'ACTIVE',
  REMOVED = 'REMOVED',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  comment_id!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.ACTIVE,
  })
  status: CommentStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('Post', 'comments', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: any;

  @ManyToOne('User', 'comments', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;
}
