import { Equals, IsBoolean } from 'class-validator';

export class MarkNotificationReadDto {
  @IsBoolean()
  @Equals(true)
  is_read: boolean;
}
