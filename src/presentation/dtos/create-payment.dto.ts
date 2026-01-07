import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Matches } from 'class-validator';
import { PaymentMethod } from '../../domain/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Customer CPF (Tax ID)',
    example: '12345678901',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF must contain exactly 11 digits' })
  cpf: string;

  @ApiProperty({
    description: 'Brief description of the financial transaction',
    example: 'Tech Test Payment',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction amount (must be positive)',
    example: 150.50,
  })
  @IsNumber()
  @IsPositive({ message: 'The payment amount must be greater than zero' })
  amount: number;

  @ApiProperty({
    description: 'Chosen payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}