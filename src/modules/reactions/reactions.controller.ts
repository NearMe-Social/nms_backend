import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  PostReactionToggleResponse,
  ReactionsService,
} from './reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: number };
}

@UseGuards(JwtAuthGuard)
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('posts/:postId/toggle')
  @HttpCode(HttpStatus.OK)
  togglePostReaction(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: RequestWithUser,
  ): Promise<PostReactionToggleResponse> {
    return this.reactionsService.togglePostReaction(postId, req.user.userId);
  }
}
