import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { Payment, PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';

@Injectable()
export class KnexPaymentRepository implements IPaymentRepository {
  private readonly tableName = 'payments';

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async save(payment: Payment): Promise<void> {
    await this.knex(this.tableName).insert({
      id: payment.id,
      cpf: payment.cpf,
      description: payment.description,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      status: payment.status,
      created_at: payment.createdAt,
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const row = await this.knex(this.tableName).where({ id }).first();
    if (!row) return null;

    return new Payment(
      row.id,
      row.cpf,
      row.description,
      Number(row.amount), 
      row.payment_method as PaymentMethod,
      row.status as PaymentStatus,
      row.created_at,
    );
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    await this.knex(this.tableName)
      .where({ id })
      .update({ status });
  }

  async search(filters: { cpf?: string; method?: PaymentMethod; status?: PaymentStatus }): Promise<Payment[]> {
    const query = this.knex(this.tableName);

    if (filters.cpf) {
      query.where('cpf', filters.cpf);
    }

    if (filters.method) {
      query.where('payment_method', filters.method);
    }

    if (filters.status) {
      query.where('status', filters.status);
    }

    const rows = await query;

    return rows.map((row) => new Payment(
      row.id,
      row.cpf,
      row.description,
      Number(row.amount),
      row.payment_method as PaymentMethod,
      row.status as PaymentStatus,
      row.created_at,
    ));
  }
}