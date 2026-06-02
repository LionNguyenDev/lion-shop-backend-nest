import { DataSourceOptions } from 'typeorm';
import { dataSourceOptions } from './database';

interface iConfig {
  env: string;
  port: number;
  allowedOrigins: string[];
  database: DataSourceOptions;
  keys: {
    privateKey: string;
    publicKey: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    webCallbackUrl: string;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default (): Partial<iConfig> => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((o) => o.trim()),
  keys: {
    privateKey: requireEnv('PRIVATE_KEY').replace(/\\n/gm, '\n'),
    publicKey: requireEnv('PUBLIC_KEY').replace(/\\n/gm, '\n'),
  },
  database: dataSourceOptions,
  google: {
    clientId: requireEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    webCallbackUrl: process.env.GOOGLE_WEB_CALLBACK_URL || 'http://localhost:3000/auth/google/web/callback',
  },
});
