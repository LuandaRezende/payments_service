import { Module } from '@nestjs/common';
import { Connection, WorkflowClient } from '@temporalio/client';
import { PaymentController } from '../../presentation/controllers/payment.controller';
import { CreatePaymentUseCase } from '../../application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../../application/use-cases/payment/update-status/update-status.use-case';
import { KnexPaymentRepository } from '../repositories/knex-payment.repository';
import { MercadoPagoGateway } from '../gateways/mercado-pago/mercado-pago.gateway';
import { DatabaseService } from '../database/database.service';
import { GetPaymentByIdUseCase } from '../../application/use-cases/payment/get-payment/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/payment/delete-payment/delete-payment.use-case';
import { PaymentActivities } from '../temporal/activities/activities';

@Module({
    controllers: [PaymentController],
    providers: [
        CreatePaymentUseCase,
        UpdateStatusUseCase,
        ListPaymentsUseCase,
        GetPaymentByIdUseCase,
        DeletePaymentUseCase,
        PaymentActivities,
        {
            provide: 'PaymentRepository',
            useClass: KnexPaymentRepository,
        },
        {
            provide: 'PaymentProvider',
            useClass: MercadoPagoGateway,
        },
        {
            provide: 'TEMPORAL_CONNECTION',
            useFactory: async () => {
                return await Connection.connect({ address: process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233' });
            },
        },
        {
            provide: 'TEMPORAL_CLIENT',
            useFactory: async () => {
                const connection = await Connection.connect({
                    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
                });

                return new WorkflowClient({
                    connection,
                    namespace: 'default',
                });
            },
        },
        DatabaseService
    ],
    exports: [
        CreatePaymentUseCase,
        UpdateStatusUseCase,
        ListPaymentsUseCase,
        'PaymentRepository',
        GetPaymentByIdUseCase,
        DeletePaymentUseCase,
        PaymentActivities,
        'TEMPORAL_CONNECTION',
        'TEMPORAL_CLIENT'
    ],
})
export class PaymentModule { }