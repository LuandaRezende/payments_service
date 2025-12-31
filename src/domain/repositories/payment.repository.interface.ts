import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export interface IPaymentRepository {
  register(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<void>;
  findByFilters(filters: { cpf?: string; method?: PaymentMethod, status?: PaymentStatus }): Promise<Payment[]>;
  remove(id: string): Promise<void>;
}