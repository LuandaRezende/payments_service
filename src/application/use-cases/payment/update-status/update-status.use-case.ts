import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "../../../../domain/entities/payment.entity";
import type { PaymentProvider } from "../../../../../src/domain/gateways/mercado-pago/payment-provider.interface";
import type { IPaymentRepository } from "../../../../../src/domain/repositories/payment.repository.interface";

@Injectable()
export class UpdateStatusUseCase {
  constructor(
    @Inject('PaymentRepository') private readonly paymentRepository: IPaymentRepository,
    @Inject('PaymentProvider') private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(id: string, manualStatus?: PaymentStatus) {
    let newStatus: PaymentStatus;
    let internalId: string = id;

    if (manualStatus) {
      // No fluxo manual, validamos se o pagamento existe antes de atualizar
      const payment = await this.paymentRepository.findById(id);
      if (!payment) throw new NotFoundException('Pagamento não encontrado');
      newStatus = manualStatus;
    } else {
      // No fluxo do Webhook (id é o ID do Mercado Pago)
      const mpPayment = await this.paymentProvider.getPaymentDetails(id);
      
      // Mapeamento robusto de status
      newStatus = this.mapStatus(mpPayment.status);
      
      // O MP retorna o nosso ID no campo external_reference
      const payment = await this.paymentRepository.findById(mpPayment.external_reference);
      if (!payment) throw new NotFoundException('Pagamento referente ao Mercado Pago não encontrado');
      
      internalId = payment.id;
    }

    // Evita updates desnecessários se o status for o mesmo
    await this.paymentRepository.updateStatus(internalId, newStatus);
    
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