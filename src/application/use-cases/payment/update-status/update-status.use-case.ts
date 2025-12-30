import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';

@Injectable()
export class UpdateStatusUseCase {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(id: string, status: PaymentStatus) {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    await this.paymentRepository.updateStatus(id, status);
    
    return { id, status, updatedAt: new Date() };
  }
}