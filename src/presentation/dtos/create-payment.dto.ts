import { IsString, IsNumber, IsEnum, IsNotEmpty, Length, Min, MinLength, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../../domain/entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: 'CPF must be at least 11 characters' })
  cpf: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PaymentMethod, { message: 'Invalid payment method. Use PIX or CREDIT_CARD' })
  paymentMethod: PaymentMethod;
}