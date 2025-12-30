import { Inject, Injectable } from '@nestjs/common';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(filters: { cpf?: string; method?: PaymentMethod; status?: PaymentStatus }) {
    return await this.paymentRepository.search(filters);
  }
}