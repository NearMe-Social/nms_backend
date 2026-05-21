import { IsEnum } from 'class-validator';

export enum AdminContentTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  MESSAGE = 'MESSAGE',
}

export enum AdminContentAction {
  HIDE = 'hide',
  REMOVE = 'remove',
  RESTORE = 'restore',
}

export class AdminContentParamsDto {
  @IsEnum(AdminContentTargetType)
  targetType: AdminContentTargetType;

  @IsEnum(AdminContentAction)
  action: AdminContentAction;
}
