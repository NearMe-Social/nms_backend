import {IsOptional, IsInt, Min} from 'class-validator';
import {Type} from 'class-transformer'

export class QueryMessagesDto{
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    page = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    size = 20;
}