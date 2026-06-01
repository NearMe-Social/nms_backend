import { Injectable, NotFoundException } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {NumericType, Repository} from 'typeorm';
import {Notification, NotificationType} from './entities/notification.entities';
import {User} from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    constructor (
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ){}

    async createNotification(
        userId : number,
        type : NotificationType,
        relatedId : number,
        message : string,
    ): Promise<Notification>{
        const user = await this.userRepository.findOne({
            where:{
                user_id: userId,
            },
        });

        if(!user){
            throw new NotFoundException(
                'User not found',
            );
        }

        const notification = this.notificationRepository.create({
            user,
            type,
            related_id: relatedId,
            message,
            is_read: false,
        });

        return await this.notificationRepository.save(notification);
    }

    async getNotificationsByUser(
        userId : number,
    ): Promise<Notification[]>{
        return await this.notificationRepository.find({
            where:{
                user: {
                    user_id: userId,
                },
            },

            relations:{
                user: true,
            },

            order:{
                created_at: 'DESC',
            }
        });
    }

    async markNotificationAsRead(
        notificationId: number,
    ): Promise<Notification>{
        const notification = await this.notificationRepository.findOne({
            where:{
                notification_id: notificationId,
            },
        });

        if(!notification){
            throw new NotFoundException('Notification not found');
        }

        notification.is_read = true;

        return await this.notificationRepository.save(notification,);
    }

}
