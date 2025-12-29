import { IsString, IsNumber, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../../domain/entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF deve ter exatamente 11 dígitos' })
  @Transform(({ value }) => value.replace(/\D/g, '')) 
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim()) 
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentMethod, {
    message: 'Método de pagamento deve ser PIX ou CREDIT_CARD',
  })
  paymentMethod: PaymentMethod;
}