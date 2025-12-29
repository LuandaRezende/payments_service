import { Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import { PaymentModule } from './infrastructure/payment.module';
import knexConfig from './infrastructure/database/knexfile'; 

@Module({
  imports: [
    // Configuração Global do Banco
    KnexModule.forRoot({
      config: knexConfig.development,
    }),
    // Seu módulo de negócio
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
