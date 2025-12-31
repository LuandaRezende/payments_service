import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import type { PaymentProvider } from '../../../../domain/gateways/mercado-pago/payment-provider.interface';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import { MercadoPagoErrorMapper } from 'src/infrastructure/gateways/mercado-pago/mercado-pago-error.mapper';
import { PaymentProviderException } from 'src/domain/exceptions/payment-provider.exception';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly repository: IPaymentRepository,

    @Inject('PaymentProvider')
    private readonly paymentProvider: PaymentProvider,
  ) { }

  async execute(dto: any) {
    const trx = await this.repository.startTransaction();

    try {
      if (!dto.paymentMethod) {
        throw new BadRequestException('Payment method is required');
      }

      const payment = Payment.create(dto);

      const savedPayment = await this.repository.register(payment, trx);

      if (
        savedPayment.paymentMethod === PaymentMethod.CREDIT_CARD ||
        savedPayment.paymentMethod === PaymentMethod.PIX
      ) {
        const preference = await this.paymentProvider.createPreference(savedPayment);

        await trx.commit();

        return {
          ...savedPayment,
          checkoutUrl: preference.init_point,
          external_reference: preference.external_reference,
        };
      }

      await trx.commit();
      return savedPayment;

    } catch (error) {
      await trx.rollback();

      const mpErrorCode = error.response?.cause?.[0]?.code || error.code;
      
      if (mpErrorCode) {
        const translatedMessage = MercadoPagoErrorMapper.translate(mpErrorCode);
        throw new PaymentProviderException(translatedMessage);
      }

      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }
}
