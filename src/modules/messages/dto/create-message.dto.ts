import {IsInt, IsString, MinLength} from 'class-validator';

export class CreateMessageDto{
    @IsInt()
    conversationId!: number;

    @IsString()
    @MinLength(1)
    content!: string
}