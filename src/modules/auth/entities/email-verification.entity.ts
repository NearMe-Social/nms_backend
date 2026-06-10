import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('email_verifications')
@Unique(['email'])
export class EmailVerification {
  @PrimaryGeneratedColumn()
  email_verification_id!: number;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  code_hash!: string;

  @Column({ type: 'integer', default: 0 })
  attempt_count!: number;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'timestamp' })
  last_sent_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  consumed_at!: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
