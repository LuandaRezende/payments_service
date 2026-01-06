import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "../../../../domain/entities/payment.entity";
import type { PaymentProvider } from "../../../../../src/domain/gateways/mercado-pago/payment-provider.interface";
import type { IPaymentRepository } from "../../../../../src/domain/repositories/payment.repository.interface";
import { Client } from '@temporalio/client';

@Injectable()
export class UpdateStatusUseCase {
  constructor(
    @Inject('PaymentRepository') private readonly paymentRepository: IPaymentRepository,
    @Inject('PaymentProvider') private readonly paymentProvider: PaymentProvider,
    @Inject('TEMPORAL_CLIENT') private readonly client: Client,
  ) { }

  async execute(id: string, manualStatus?: PaymentStatus) {
    let newStatus: PaymentStatus;
    let internalId: string = id;

    if (manualStatus) {
      const payment = await this.paymentRepository.findById(id);
      if (!payment) throw new NotFoundException('Pagamento não encontrado');
      newStatus = manualStatus;
    } else {
      const mpPayment = await (this.paymentProvider as any).getRealPaymentStatus(id);

      newStatus = this.mapStatus(mpPayment.status);

      const payment = await this.paymentRepository.findById(mpPayment.external_reference);
      if (!payment) {
        throw new NotFoundException('Pagamento referente ao Mercado Pago não encontrado no banco local');
      }

      internalId = payment.id;
    }

    await this.paymentRepository.updateStatus(internalId, newStatus);

    try {
      const workflowId = `payment-${internalId}`;
      const handle = this.client.workflow.getHandle(workflowId);

      await handle.signal('paymentResult', {
        status: newStatus
      });

      console.log(`[Temporal] Sinal 'paymentResult' enviado com sucesso para: ${workflowId}`);
    } catch (error) {
      console.warn(`[Temporal] Não foi possível sinalizar o workflow ${internalId}:`, error.message);
    }

    return { id: internalId, status: newStatus };
  }

  private mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.PAID;
      case 'rejected':
      case 'cancelled':
        return PaymentStatus.FAIL;
      case 'pending':
      case 'in_process':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }
}