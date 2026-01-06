import { Inject, Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '../../../domain/entities/payment.entity';
import type { PaymentProvider } from '../../../domain/gateways/mercado-pago/payment-provider.interface';
import type { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';

@Injectable()
export class PaymentActivities {
  private readonly logger = new Logger(PaymentActivities.name);

  constructor(
    @Inject('PaymentProvider') private readonly paymentProvider: PaymentProvider,
    @Inject('PaymentRepository') private readonly repository: IPaymentRepository,
  ) { }

  async createExternalPreference(paymentId: string): Promise<{ id: string; url: string }> {
  const payment = await this.repository.findById(paymentId);
  if (!payment) throw new Error('Pagamento não encontrado');

  const result = await this.paymentProvider.createPreference({
    id: payment.id,
    description: payment.description,
    amount: payment.amount,
  });

  await this.repository.updateExternalId(paymentId, result.external_reference);

  return { 
    id: result.external_reference, 
    url: result.init_point 
  };
}


async syncPaymentStatusWithGateway(paymentId: string, externalId: string): Promise<any> {
    const payment = await this.repository.findById(paymentId);
    if (!payment) throw new Error(`Pagamento ${paymentId} não encontrado no banco.`);
    const status = await this.paymentProvider.getStatus(externalId);
    
    await this.repository.updateStatus(paymentId, status);
    return status;
}

  async markPaymentAsFailed(paymentId: string): Promise<void> {
    this.logger.error(`Marking payment ${paymentId} as FAILED due to workflow interruption or error.`);
    await this.repository.updateStatus(paymentId, PaymentStatus.FAIL);
  }
}