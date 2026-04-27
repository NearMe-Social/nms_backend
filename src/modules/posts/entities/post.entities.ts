import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


// 1. PLACE THE HELPER HERE (Top of file, outside the class)
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

export enum PostStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  post_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  // 2. UPDATE LATITUDE WITH TRANSFORMER
  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 7, 
    transformer: new ColumnNumericTransformer() 
  })
  latitude: number; // Changed from string to number

  // 3. UPDATE LONGITUDE WITH TRANSFORMER
  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 7, 
    transformer: new ColumnNumericTransformer() 
  })
  longitude: number; // Changed from string to number

  @Column({ type: 'int' })
  visibility_radius: number;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}