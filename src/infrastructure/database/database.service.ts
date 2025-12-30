import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import config from './knexfile';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private instance: Knex;

  constructor() {
    const envConfig = process.env.NODE_ENV === 'test' ? config.test : config.development;
    this.instance = knex(envConfig);
  }

  onModuleInit() {
  }

  onModuleDestroy() {
    return this.instance.destroy();
  }

  getKnex(): Knex {
    return this.instance;
  }
}