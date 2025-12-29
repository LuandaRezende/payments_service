import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'payments_service_db',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass',
    },
    migrations: {
      directory: './src/infrastructure/database/migrations',
      extension: 'ts',
    },
  },
};

export default config;