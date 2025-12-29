import { Module } from '@nestjs/common';
import { PaymentController } from '../presentation/controllers/payment.controller';
import { CreatePaymentUseCase } from '../application/use-cases/create-payment.use-case';
import { ListPaymentsUseCase } from '../application/use-cases/list-payments.use-case';
import { UpdateStatusUseCase } from '../application/use-cases/update-status.use-case';
import { KnexPaymentRepository } from './repositories/knex-payment.repository';

@Module({
  controllers: [PaymentController],
  providers: [
    CreatePaymentUseCase,
    ListPaymentsUseCase,
    UpdateStatusUseCase,
    {
      // Vinculamos a Interface (Token) à Implementação Concreta
      provide: 'IPaymentRepository',
      useClass: KnexPaymentRepository,
    },
  ],
})
export class PaymentModule {}