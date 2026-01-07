import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Preference, Payment, MercadoPagoConfig } from 'mercadopago';
import { PaymentProvider } from '../../../domain/gateways/mercado-pago/payment-provider.interface';
import { MercadoPagoErrorMapper } from './mercado-pago-error.mapper';

@Injectable()
export class MercadoPagoGateway implements PaymentProvider {
    private client: MercadoPagoConfig;

    constructor() {
        const token = process.env.TOKEN_MERCADO_PAGO;
        if (!token) {
            throw new Error('TOKEN_MERCADO_PAGO is not defined in environment variables');
        }
        this.client = new MercadoPagoConfig({ accessToken: token });
    }

    async createPreference(payment: any): Promise<{ init_point: string; external_reference: string }> {
        try {
            const preference = new Preference(this.client);
            const expirationDate = new Date();
            expirationDate.setHours(expirationDate.getHours() + 24);

            const result = await preference.create({
                body: {
                    items: [{
                        id: payment.id,
                        title: payment.description || 'Order',
                        unit_price: Number(payment.amount),
                        quantity: 1,
                    }],
                    external_reference: payment.id,
                    notification_url: process.env.WEBHOOK_URL,
                    expires: true,
                    expiration_date_to: expirationDate.toISOString(),
                },
            });

            if (!result.init_point || !result.id) {
                throw new Error('Incomplete response received from Mercado Pago gateway');
            }

            return {
                init_point: result.init_point,
                external_reference: result.id,
            };
        } catch (error) {
            throw MercadoPagoErrorMapper.toDomainError(error);
        }
    }

    async getPaymentDetails(externalId: string): Promise<{ status: string; external_reference: string }> {
        try {
            const preference = new Preference(this.client);
            const result = await preference.get({ preferenceId: externalId });

            return {
                status: 'PENDING',
                external_reference: result.external_reference || '',
            };
        } catch (error) {
            throw new Error('Não foi possível validar o recurso no Mercado Pago.');
        }
    }

    async getStatus(externalId: string): Promise<any> {
        try {
            const response = await this.getPaymentDetails(externalId);

            return response.status;
        } catch (error) {
            console.error('[MercadoPagoGateway] Error fetching payment status:', error);
            throw new Error('Communication failure with the payment provider');
        }
    }

    async getRealPaymentStatus(paymentId: string): Promise<{ status: string; external_reference: string }> {
        try {
            const payment = new Payment(this.client);
            const result = await payment.get({ id: paymentId });

            return {
                status: result.status || 'unknown',
                external_reference: result.external_reference || '',
            };
        } catch (error) {
            console.error('Erro ao buscar pagamento real no MP:', error);
            throw new Error('Pagamento não encontrado no provedor.');
        }
    }
}