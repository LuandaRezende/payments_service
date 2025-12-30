import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<void>;
  search(filters: { cpf?: string; method?: PaymentMethod, status?: PaymentStatus }): Promise<Payment[]>;
}