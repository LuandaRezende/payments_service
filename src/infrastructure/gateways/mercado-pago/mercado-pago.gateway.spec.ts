import { MercadoPagoGateway } from './mercado-pago.gateway';
import { Preference, Payment } from 'mercadopago';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('mercadopago');

describe('MercadoPagoGateway', () => {
    let gateway: MercadoPagoGateway;

    beforeEach(() => {
        process.env.TOKEN_MERCADO_PAGO = 'test-token';
        gateway = new MercadoPagoGateway();
        jest.clearAllMocks();
    });

    describe('createPreference', () => {
        it('deve criar uma preferência com sucesso', async () => {
            const mockResult = {
                init_point: 'http://pagamento.com',
                external_reference: 'id-123',
            };
            (Preference.prototype.create as jest.Mock).mockResolvedValue(mockResult);

            const result = await gateway.createPreference({ id: 'id-123', amount: 100 });
            expect(result.init_point).toBe(mockResult.init_point);
        });

        it('deve entrar no catch e lançar InternalServerErrorException', async () => {
            (Preference.prototype.create as jest.Mock).mockRejectedValue(new Error('Erro SDK'));

            await expect(gateway.createPreference({}))
                .rejects
                .toThrow(InternalServerErrorException);
        });
    });

    describe('getPaymentDetails', () => {
        it('deve retornar detalhes com sucesso', async () => {
            const mockPayment = { status: 'approved', external_reference: 'ref-123' };
            (Payment.prototype.get as jest.Mock).mockResolvedValue(mockPayment);

            const result = await gateway.getPaymentDetails('mp-123');
            expect(result.status).toBe('approved');
        });

        it('deve retornar status fail quando o pagamento não existe (catch)', async () => {
            (Payment.prototype.get as jest.Mock).mockRejectedValue(new Error('Not Found'));

            const result = await gateway.getPaymentDetails('invalid');
            expect(result.status).toBe('fail');
            expect(result.external_reference).toBe('');
        });

        it('should throw error if token is missing', () => {
            delete process.env.TOKEN_MERCADO_PAGO;
            expect(() => new MercadoPagoGateway()).toThrow('TOKEN_MERCADO_PAGO não definido');
        });

        it('should throw error if preference result is incomplete', async () => {
            (Preference.prototype.create as jest.Mock).mockResolvedValue({ init_point: null });
            await expect(gateway.createPreference({})).rejects.toThrow(InternalServerErrorException);
        });

        it('should return status fail when an unexpected error occurs in getPaymentDetails', async () => {
            const Payment = require('mercadopago').Payment;
            (Payment.prototype.get as jest.Mock).mockRejectedValue(new Error('Unexpected Error'));

            const result = await gateway.getPaymentDetails('any-id');

            expect(result.status).toBe('fail');
            expect(result.external_reference).toBe('');
        });

        it('should handle unexpected errors in getPaymentDetails', async () => {
            const Payment = require('mercadopago').Payment;
            (Payment.prototype.get as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const result = await gateway.getPaymentDetails('any-id');
            expect(result.status).toBe('fail');
        });

        it('should return default fail status if SDK returns empty status', async () => {
            (Payment.prototype.get as jest.Mock).mockResolvedValue({
                status: null,
                external_reference: 'ref-123'
            });

            const result = await gateway.getPaymentDetails('mp-123');

            expect(result.status).toBe('fail');
            expect(result.external_reference).toBe('ref-123');
        });

        it('should return empty external_reference if SDK returns it empty', async () => {
            (Payment.prototype.get as jest.Mock).mockResolvedValue({
                status: 'approved',
                external_reference: null
            });

            const result = await gateway.getPaymentDetails('mp-123');

            expect(result.external_reference).toBe('');
        });
    });
});