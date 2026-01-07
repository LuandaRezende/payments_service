import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';

export class UpdatePaymentStatusDto {
  @ApiProperty({ 
    enum: PaymentStatus, 
    example: 'PAID',
    description: 'New status for manually update' 
  })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;
}