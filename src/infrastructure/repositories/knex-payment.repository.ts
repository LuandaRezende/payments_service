import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';

@Injectable()
export class KnexPaymentRepository implements IPaymentRepository {
    constructor(@InjectConnection() private readonly knex: Knex) { }

    async register(payment: Payment, trx?: Knex.Transaction): Promise<Payment> {
        const query = trx ? this.knex('payments').transacting(trx) : this.knex('payments');

        await query.insert({
            id: payment.id,
            cpf: payment.cpf,
            amount: payment.amount,
            status: payment.status,
            payment_method: payment.paymentMethod,
            description: payment.description,
        });

        return payment;
    }

    async findById(id: string): Promise<Payment | null> {
        const row = await this.knex('payments').where({ id }).first();
        if (!row) return null;
        return this.mapToEntity(row);
    }

    async findByFilters(filters: { cpf?: string; method?: PaymentMethod; status?: PaymentStatus }): Promise<Payment[]> {
        const query = this.knex('payments');

        if (filters.cpf) query.where('cpf', filters.cpf);
        if (filters.method) query.where('method', filters.method);
        if (filters.status) query.where('status', filters.status);

        const rows = await query;
        return rows.map(row => this.mapToEntity(row));
    }

    async updateStatus(id: string, status: PaymentStatus): Promise<void> {
        await this.knex('payments').where({ id }).update({ status });
    }

    async remove(id: string): Promise<void> {
        await this.knex('payments').where({ id }).del();
    }

    private mapToEntity(row: any): Payment {
        return Payment.create(row);
    }

    async startTransaction(): Promise<Knex.Transaction> {
        return await this.knex.transaction();
    }
}