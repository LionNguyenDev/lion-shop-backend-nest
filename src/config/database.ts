import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

const sharedOptions = {
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
  extra: {
    max: parseInt(process.env.POSTGRES_POOL_SIZE ?? '10', 10) || 10,
    connectionTimeoutMillis: 5000,
  },
};

// DATABASE_URL is used for cloud deployments (e.g. Render internal connection — no SSL needed)
const connectionUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = connectionUrl
  ? { type: 'postgres', url: connectionUrl, ...sharedOptions }
  : {
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
      ...sharedOptions,
    };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
