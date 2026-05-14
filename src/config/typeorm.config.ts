import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'postgres',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'nearme_user',
  password: process.env.DB_PASSWORD ?? 'nearme_pass',
  database: process.env.DB_NAME ?? 'nearme_social',
  entities: [__dirname + '/../**/*.{entity,entities}.{ts,js}'],
  synchronize: true,
  logging: false,
});
