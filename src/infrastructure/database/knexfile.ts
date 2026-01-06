import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const config = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass',
      database: process.env.DB_NAME || 'payments_service_db',
    },
    migrations: { directory: './migrations', extension: 'ts' },
  },
  test: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5432,
      user: 'user',
      password: 'pass',
      database: 'payments_test_db',
    },
    migrations: { directory: './migrations', extension: 'ts' },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './dist/migrations' },
  }
};

export default config;
module.exports = config;