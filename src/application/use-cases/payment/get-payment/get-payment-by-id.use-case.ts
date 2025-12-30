import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';

@Injectable()
export class GetPaymentByIdUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly repository: IPaymentRepository,
  ) {}

  async execute(id: string) {
    const payment = await this.repository.findById(id);

    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    }

    return payment;
  }
}