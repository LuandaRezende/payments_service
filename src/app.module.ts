import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnexModule } from 'nest-knexjs';
import { PaymentModule } from './infrastructure/payment.module';
import knexConfig from '../knexfile'; 

@Module({
  imports: [
    // Configuração Global do Banco
    KnexModule.forRoot({
      config: knexConfig.development,
    }),
    // Seu módulo de negócio
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
