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
    public createdAt: Date,
  ) {
    this.cpf = cpfValidator.strip(this.cpf);
    this.validate();
  }

  private validate() {
    if (this.amount <= 0) {
      throw new Error('O valor do pagamento deve ser maior que zero');
    }

    if (!cpfValidator.isValid(this.cpf)) {
      throw new Error('CPF informado é inválido');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('A descrição é obrigatória');
    }
  }

  static create(props: Omit<Payment, 'id' | 'status' | 'createdAt'>): Payment {
    return new Payment(
      crypto.randomUUID(),
      props.cpf,
      props.description,
      props.amount,
      props.paymentMethod,
      PaymentStatus.PENDING,
      new Date(),
    );
  }
}