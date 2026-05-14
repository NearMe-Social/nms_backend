import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { UserBlock } from './entities/user-block.entity';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {

      constructor(private readonly blocksService: BlocksService) {}
    
    @Post()
    @HttpCode(HttpStatus.CREATED)
    block(@Body() createBlockDto: CreateBlockDto): Promise<UserBlock> {
        return this.blocksService.block(createBlockDto);
  }

}
