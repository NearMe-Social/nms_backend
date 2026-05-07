import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  comment_id!: number;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne('Post', 'comments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: any;

  @ManyToOne('User', 'comments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;
}
