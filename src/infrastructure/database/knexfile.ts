import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'payments_service_db',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass',
      port: Number(process.env.DB_PORT) || 5432,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'payments_service_db',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass',
      port: Number(process.env.DB_PORT) || 5432,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
  },
};

export default config;