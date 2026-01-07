import { MercadoPagoGateway } from './mercado-pago.gateway';
import { Preference, Payment } from 'mercadopago';
import { MercadoPagoErrorMapper } from './mercado-pago-error.mapper';

jest.mock('mercadopago');
jest.mock('./mercado-pago-error.mapper');

describe('MercadoPagoGateway', () => {
    let gateway: MercadoPagoGateway;
    const MOCK_TOKEN = 'test-token';

    beforeEach(() => {
        process.env.TOKEN_MERCADO_PAGO = MOCK_TOKEN;
        process.env.WEBHOOK_URL = 'https://webhook.test';

        jest.clearAllMocks();
        gateway = new MercadoPagoGateway();

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should throw an error if TOKEN_MERCADO_PAGO is not provided in environment variables', () => {
            delete process.env.TOKEN_MERCADO_PAGO;
            expect(() => new MercadoPagoGateway()).toThrow('TOKEN_MERCADO_PAGO is not defined');
        });
    });

    describe('createPreference', () => {
        it('should successfully generate a checkout link (Happy Path)', async () => {
            const mockResponse = { init_point: 'http://link.com', id: 'pref-123' };
            (Preference.prototype.create as jest.Mock).mockResolvedValue(mockResponse);

            const result = await gateway.createPreference({ id: '123', amount: 100 });

            expect(result.init_point).toBe('http://link.com');
            expect(result.external_reference).toBe('pref-123');
        });

        it('should reject when the SDK returns an incomplete or invalid response', async () => {
            (Preference.prototype.create as jest.Mock).mockResolvedValue({ init_point: null });
            (MercadoPagoErrorMapper.toDomainError as jest.Mock).mockReturnValue(new Error('Incomplete data'));

            await expect(gateway.createPreference({})).rejects.toThrow();
        });

        it('should map SDK-specific errors to domain-friendly errors using ErrorMapper', async () => {
            (Preference.prototype.create as jest.Mock).mockRejectedValue(new Error('Low level SDK failure'));
            (MercadoPagoErrorMapper.toDomainError as jest.Mock).mockReturnValue(new Error('Mapped Domain Error'));

            await expect(gateway.createPreference({})).rejects.toThrow('Mapped Domain Error');
        });
    });

    describe('getPaymentDetails', () => {
        it('should retrieve payment details and default to PENDING status', async () => {
            (Preference.prototype.get as jest.Mock).mockResolvedValue({ external_reference: 'ref-123' });

            const result = await gateway.getPaymentDetails('id');
            expect(result.status).toBe('PENDING');
            expect(result.external_reference).toBe('ref-123');
        });

        it('should return an empty string if the external reference is missing in the preference', async () => {
            (Preference.prototype.get as jest.Mock).mockResolvedValue({ external_reference: null });

            const result = await gateway.getPaymentDetails('id');
            expect(result.external_reference).toBe('');
        });

        it('should throw a custom error message when the SDK fails to retrieve preference details', async () => {
            (Preference.prototype.get as jest.Mock).mockRejectedValue(new Error());
            await expect(gateway.getPaymentDetails('id'))
                .rejects.toThrow('Não foi possível validar o recurso no Mercado Pago.');
        });
    });

    describe('getStatus', () => {
        it('should successfully fetch and return the generic payment status', async () => {
            jest.spyOn(gateway, 'getPaymentDetails').mockResolvedValue({ status: 'SUCCESS', external_reference: 'ref' });
            expect(await gateway.getStatus('id')).toBe('SUCCESS');
        });

        it('should log the error and throw a communication failure exception upon SDK error', async () => {
            jest.spyOn(gateway, 'getPaymentDetails').mockRejectedValue(new Error('Connection timeout'));
            await expect(gateway.getStatus('id')).rejects.toThrow('Communication failure');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getRealPaymentStatus', () => {
        it('should retrieve the actual payment status and reference from the Payment SDK', async () => {
            (Payment.prototype.get as jest.Mock).mockResolvedValue({
                status: 'approved',
                external_reference: 'order-001'
            });

            const result = await gateway.getRealPaymentStatus('id');
            expect(result.status).toBe('approved');
            expect(result.external_reference).toBe('order-001');
        });

        it('should provide default values when the SDK returns null or undefined fields', async () => {
            (Payment.prototype.get as jest.Mock).mockResolvedValue({
                status: null,
                external_reference: undefined
            });

            const result = await gateway.getRealPaymentStatus('id');

            expect(result.status).toBe('unknown');
            expect(result.external_reference).toBe('');
        });

        it('should log a console error and throw a specialized exception when the payment is not found', async () => {
            (Payment.prototype.get as jest.Mock).mockRejectedValue(new Error('Not Found'));

            await expect(gateway.getRealPaymentStatus('id'))
                .rejects.toThrow('Pagamento não encontrado no provedor.');

            expect(console.error).toHaveBeenCalled();
        });
    });
});