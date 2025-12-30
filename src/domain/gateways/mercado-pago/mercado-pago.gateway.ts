import { Injectable } from '@nestjs/common';
import { Preference, Payment, MercadoPagoConfig } from 'mercadopago';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MercadoPagoGateway implements PaymentProvider {
    private client: MercadoPagoConfig;

    constructor() {
        const token = process.env.TOKEN_MERCADO_PAGO;

        if (!token) {
            throw new Error('TOKEN_MERCADO_PAGO não definido');
        }

        this.client = new MercadoPagoConfig({
            accessToken: token,
        });
    }

    async createPreference(payment: any): Promise<{
        init_point: string;
        external_reference: string;
    }> {
        const preference = new Preference(this.client);

        const result = await preference.create({
            body: {
                items: [{
                    id: payment.id,
                    title: payment.description,
                    unit_price: payment.amount,
                    quantity: 1,
                }],
                external_reference: payment.id,
                notification_url: 'https://seu-dominio.com/api/payment/webhook', //trocar pra variavel de ambiente
            },
        });

        if (!result.init_point || !result.external_reference) {
            throw new Error('Erro ao criar preferência no Mercado Pago');
        }

        return {
            init_point: result.init_point,
            external_reference: result.external_reference,
        };
    }

    async getPaymentDetails(externalId: string): Promise<{ status: string; external_reference: string }> {
        const payment = new Payment(this.client);
        
        const result = await payment.get({ id: externalId });

        return {
            status: result.status || 'fail',
            external_reference: result.external_reference || '',
        };
    }
}