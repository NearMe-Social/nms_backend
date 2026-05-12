import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

@Entity('reactions')
export class Reaction {
  @PrimaryGeneratedColumn()
  reaction_id: number;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
  })
  type: ReactionType;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne('Post', 'reactions', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: any;

  @ManyToOne('User', 'reactions', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;
}
