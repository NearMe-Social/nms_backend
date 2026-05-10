import 'dotenv/config';
import * as path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',

  url: process.env.DB_URL,

  entities: [
    path.join(__dirname, '**/*.entity.ts'),
    path.join(__dirname, '**/*.entities.ts'),
  ],

  migrations: [path.join(__dirname, 'database/migrations/*.ts')],

  synchronize: false,

  logging: process.env.DB_LOGGING === 'true',

  ssl: {
    rejectUnauthorized: false,
  },
});

export default AppDataSource;