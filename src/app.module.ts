import { Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import { PaymentModule } from './infrastructure/modules/payment.module';
import knexConfig from './infrastructure/database/knexfile';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './presentation/controllers/payment.controller';

const env = process.env.NODE_ENV || 'development';
const knexConfigForEnv = (knexConfig as any)[env];

@Module({
  imports: [
    KnexModule.forRoot({
      config: knexConfigForEnv,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentModule,
  ],
  controllers: [PaymentController],
  providers: [],
})
export class AppModule { }