import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { NotificationType } from '../entities/notification.entities';

export class CreateNotificationDto {
	@Type(() => Number)
	@IsInt()
	user_id: number;

	@IsEnum(NotificationType)
	type: NotificationType;

	@Type(() => Number)
	@IsInt()
	related_id: number;

	@IsNotEmpty()
	@IsString()
	@MinLength(1)
	message: string;
}
