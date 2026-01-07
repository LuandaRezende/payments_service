import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { IPaymentRepository } from "src/domain/repositories/payment.repository.interface";

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    @Inject('PaymentRepository') 
    private readonly repository: IPaymentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const payment = await this.repository.findById(id);
    
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    await this.repository.remove(id);
  }
}