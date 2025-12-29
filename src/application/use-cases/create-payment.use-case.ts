// src/application/use-cases/create-payment.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { Payment, PaymentMethod } from '../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(input: { cpf: string; description: string; amount: number; paymentMethod: PaymentMethod }) {
    const payment = Payment.create(input);
    
    // Aqui entraria a chamada para um Gateway de Pagamento se for CREDIT_CARD
    if (payment.paymentMethod === 'CREDIT_CARD') {
      // TODO: Integration with Payment Gateway (Stripe/Adyen)
    }

    await this.paymentRepository.save(payment);
    return payment;
  }
}