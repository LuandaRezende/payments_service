import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../../domain/entities/payment.entity';
import type { PaymentProvider } from 'src/domain/gateways/mercado-pago/payment-provider.interface';
import type { IPaymentRepository } from 'src/domain/repositories/payment.repository.interface';

@Injectable()
export class PaymentActivities {
  constructor(
    @Inject('PaymentProvider') private readonly paymentProvider: PaymentProvider,
    @Inject('PaymentRepository') private readonly repository: IPaymentRepository,
  ) { }

  async syncPaymentStatusWithGateway(paymentId: string): Promise<any> {
    const payment = await this.repository.findById(paymentId);

    if (!payment || !payment.externalId) {
      throw new Error(`Payment ${paymentId} does not have an associated external ID.`);
    }

    const externalStatus = await this.paymentProvider.getStatus(payment.externalId);

    await this.repository.updateStatus(paymentId, externalStatus);

    return externalStatus;
  }

  async markPaymentAsFailed(paymentId: string): Promise<void> {
    await this.repository.updateStatus(paymentId, PaymentStatus.FAIL);
  }
}