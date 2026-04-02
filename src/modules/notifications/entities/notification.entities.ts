import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
	Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
	SYSTEM = 'SYSTEM',
	MESSAGE = 'MESSAGE',
	COMMENT = 'COMMENT',
	REPORT = 'REPORT',
}

@Entity('notifications')
export class Notification {
	@PrimaryGeneratedColumn()
	notification_id: number;

	@ManyToOne(() => User, (user) => user.notifications, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user: User;

	@Column({
		type: 'enum',
		enum: NotificationType,
	})
	type: NotificationType;

	@Column()
	related_id: number;

	@Column({ type: 'text' })
	message: string;

	@Column({ type: 'boolean', default: false })
	is_read: boolean;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	created_at: Date;
}
