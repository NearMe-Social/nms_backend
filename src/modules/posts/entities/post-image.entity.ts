import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entities';

@Entity('post_images')
export class PostImage {
  @PrimaryGeneratedColumn()
  post_image_id!: number;

  @Column({ type: 'varchar' })
  image_url!: string;

  @Column({ type: 'int', default: 0 })
  display_order!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'int' })
  post_id!: number;

  @ManyToOne(() => Post, (post) => post.images, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}
