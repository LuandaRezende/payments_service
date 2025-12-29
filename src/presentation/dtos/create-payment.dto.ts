import { IsString, IsNumber, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { PaymentMethod } from '../../domain/entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF deve ter exatamente 11 dígitos' })
  cpf: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentMethod, {
    message: 'Método de pagamento deve ser PIX ou CREDIT_CARD',
  })
  paymentMethod: PaymentMethod;
}