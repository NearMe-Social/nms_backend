import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum PostStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  post_id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude!: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude!: number;

  @Column({ type: 'int', default: 200 })
  visibility_radius!: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.ACTIVE,
  })
  status!: PostStatus;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne('User', 'posts', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @OneToMany('Comment', 'post')
  comments!: any[];

  @OneToMany('Reaction', 'post')
  reactions!: any[];
}
