import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import type { PaymentProvider } from 'src/domain/gateways/mercado-pago/payment-provider.interface';

@Injectable()
export class UpdateStatusUseCase {
  constructor(
    @Inject('PaymentRepository') private readonly paymentRepository: IPaymentRepository,
    @Inject('PaymentProvider') private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(id: string, manualStatus?: PaymentStatus) {
    let newStatus: PaymentStatus;

    if (manualStatus) {
      newStatus = manualStatus;
    } else {
      const mpPayment = await this.paymentProvider.getPaymentDetails(id);
      newStatus = mpPayment.status === 'approved' ? PaymentStatus.PAID : PaymentStatus.FAIL;
      const payment = await this.paymentRepository.findById(mpPayment.external_reference);
     
      if (!payment) throw new NotFoundException('Pagamento não encontrado');

      id = payment.id;
    }

    await this.paymentRepository.updateStatus(id, newStatus);
    return { id, status: newStatus };
  }
}