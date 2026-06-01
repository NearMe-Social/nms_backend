import {IsEnum, IsInt, IsNotEmpty, IsString} from 'class-validator';
import {NotificationType} from '../entities/notification.entities';


export class CreateNotificationDto{
    @IsInt()
    user_id: number;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsInt()
    related_id : number;

    @IsString()
    @IsNotEmpty()
    message: string;

}