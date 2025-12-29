import * as crypto from 'crypto';

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
  ) {}

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