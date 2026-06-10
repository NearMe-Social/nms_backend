import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { R2ImageStorageService } from './r2-image-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, R2ImageStorageService],
  exports: [UsersService, R2ImageStorageService],
})
export class UsersModule {}
