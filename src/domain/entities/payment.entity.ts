import * as crypto from 'crypto';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAIL = 'FAIL',
}

export class Payment {
  constructor(
    public readonly id: string,
    public cpf: string,
    public description: string,
    public amount: number,
    public paymentMethod: PaymentMethod,
    public status: PaymentStatus,
    public externalId?: string,
  ) {
    this.cpf = cpfValidator.strip(this.cpf);
    this.validate();
  }

  private validate() {
    if (this.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (!cpfValidator.isValid(this.cpf)) {
      throw new Error('The provided CPF is invalid');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Description is required and cannot be empty');
    }
  }

  static create(props: Omit<Payment, 'id' | 'status'>): Payment {
    return new Payment(
      crypto.randomUUID(),
      props.cpf,
      props.description,
      props.amount,
      props.paymentMethod,
      PaymentStatus.PENDING,
    );
  }
}