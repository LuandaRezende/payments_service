import { Module } from '@nestjs/common';
import { PaymentController } from '../presentation/controllers/payment.controller';
import { CreatePaymentUseCase } from '../application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../application/use-cases/payment/update-status/update-status.use-case';
import { KnexPaymentRepository } from './repositories/knex-payment.repository';
import { MercadoPagoGateway } from './gateways/mercado-pago/mercado-pago.gateway';
import { DatabaseService } from './database/database.service';
import { GetPaymentByIdUseCase } from '../application/use-cases/payment/get-payment/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../application/use-cases/payment/delete-payment/delete-payment.use-case';

@Module({
    controllers: [PaymentController],
    providers: [
        CreatePaymentUseCase,
        UpdateStatusUseCase,
        ListPaymentsUseCase,
        GetPaymentByIdUseCase,
        DeletePaymentUseCase,
        {
            provide: 'PaymentRepository',
            useClass: KnexPaymentRepository,
        },
        {
            provide: 'PaymentProvider',
            useClass: MercadoPagoGateway,
        },
        DatabaseService
    ],
    exports: [CreatePaymentUseCase, UpdateStatusUseCase, ListPaymentsUseCase, 'PaymentRepository', GetPaymentByIdUseCase, DeletePaymentUseCase],
})
export class PaymentModule { }