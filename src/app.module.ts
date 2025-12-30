import { Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import { PaymentModule } from './infrastructure/payment.module';
import knexConfig from './infrastructure/database/knexfile'; 
import { PaymentController } from './presentation/controllers/payment.controller';

@Module({
  imports: [
    KnexModule.forRoot({
      config: process.env.NODE_ENV === 'test' ? knexConfig.test : knexConfig.development,
    }),
    PaymentModule,
  ],
  controllers: [PaymentController],
  providers: [],
})
export class AppModule {}
