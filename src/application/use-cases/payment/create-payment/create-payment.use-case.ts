// src/application/use-cases/create-payment.use-case.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Payment, PaymentMethod } from '../../../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) { }

  async execute(input: { cpf: string; description: string; amount: number; paymentMethod: PaymentMethod }) {
    try {
      const payment = Payment.create(input);
      await this.paymentRepository.save(payment);
      return payment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}