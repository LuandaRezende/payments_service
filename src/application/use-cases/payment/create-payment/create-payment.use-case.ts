import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Payment } from '../../../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import { WorkflowClient } from '@temporalio/client';
import { processPaymentWorkflow } from '../../../workflows/payment.workflow';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly repository: IPaymentRepository,
    @Inject('TEMPORAL_CLIENT')
    private readonly temporalClient: any,
  ) { }

  async execute(dto: any) {
    this.validate(dto);

    const trx = await this.repository.startTransaction();

    try {
      const payment = Payment.create(dto);
      const savedPayment = await this.repository.register(payment, trx);

      const handle = await (this.temporalClient as WorkflowClient).start(processPaymentWorkflow, {
        args: [savedPayment],
        taskQueue: 'payments-queue',
        workflowId: `payment-${savedPayment.id}`,
      });

      await trx.commit();

      console.log('Use Case: Aguardando resultado do Workflow...');
      const result = await handle.result();
      console.log('Use Case: Resultado recebido do Workflow:', result);


      return {
        ...savedPayment,
        workflowId: handle.workflowId,
        status: 'PROCESSING',
        checkoutUrl: result?.url || 'URL_NAO_GERADA',
      };
    } catch (error) {
      if (trx) await trx.rollback();
      throw error;
    }
  }

  private validate(dto: any): void {
    if (!dto?.paymentMethod) {
      throw new BadRequestException('Payment method is required');
    }
  }
}