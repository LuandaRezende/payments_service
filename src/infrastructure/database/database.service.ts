import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import config from './knexfile';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private instance: Knex;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const envConfig = (config as any)[env];

    if (!envConfig) {
      throw new Error(`Knex configuration for environment "${env}" not found in knexfile.ts`);
    }

    this.instance = knex(envConfig);
  }

  async onModuleInit() {
    try {
      await this.instance.raw('SELECT 1');
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.instance.destroy();
  }

  getKnex(): Knex {
    return this.instance;
  }
}