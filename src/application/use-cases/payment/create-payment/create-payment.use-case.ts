import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import type { PaymentProvider } from '../../../../domain/gateways/mercado-pago/payment-provider.interface';
import type { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface';
import { MercadoPagoErrorMapper } from '../../../../infrastructure/gateways/mercado-pago/mercado-pago-error.mapper';
import { PaymentProviderException } from '../../../../domain/exceptions/payment-provider.exception';

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

        if (!preference || !preference.init_point) {
          throw new Error('Invalid response from payment provider');
        }

        await trx.commit();

        return {
          ...savedPayment,
          checkoutUrl: preference.init_point,
          externalReference: savedPayment.id,
        };
      }

      await trx.commit();
      return savedPayment;

    } catch (error) {
      await trx.rollback();

      if (error instanceof BadRequestException) {
        throw error;
      }

      const mpErrorCode = error.response?.cause?.[0]?.code || error.code;

      const translatedMessage = MercadoPagoErrorMapper.map(mpErrorCode);
      throw new PaymentProviderException(translatedMessage);
    }
  }
}
