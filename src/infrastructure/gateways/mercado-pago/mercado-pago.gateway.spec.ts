import { MercadoPagoGateway } from './mercado-pago.gateway';
import { Preference, Payment } from 'mercadopago';

jest.mock('mercadopago');

describe('Integration test MercadoPagoGateway', () => {
    let gateway: MercadoPagoGateway;
    const MOCK_TOKEN = 'test-token';

    beforeEach(() => {
        process.env.TOKEN_MERCADO_PAGO = MOCK_TOKEN;
        gateway = new MercadoPagoGateway();
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('Initialization logic', () => {
        it('should throw a configuration error if TOKEN_MERCADO_PAGO is missing', () => {
            delete process.env.TOKEN_MERCADO_PAGO;

            expect(() => new MercadoPagoGateway()).toThrow('TOKEN_MERCADO_PAGO is not defined in environment variables');
        });
    });

    describe('createPreference() method', () => {
        it('should successfully create a checkout preference and return the initialization point', async () => {
            const mockResponse = { init_point: 'https://checkout.mercadopago.com', external_reference: 'order-123' };
            (Preference.prototype.create as jest.Mock).mockResolvedValue(mockResponse);

            const result = await gateway.createPreference({ id: 'order-123', amount: 100 });

            expect(result.init_point).toBe(mockResponse.init_point);
            expect(Preference.prototype.create).toHaveBeenCalled();
        });

        it('should reject the promise when the provider returns an incomplete or malformed payload', async () => {
            (Preference.prototype.create as jest.Mock).mockResolvedValue({ init_point: null });

            await expect(gateway.createPreference({})).rejects.toThrow();
        });

        it('should propagate a high-level exception when the SDK library fails to communicate', async () => {
            (Preference.prototype.create as jest.Mock).mockRejectedValue(new Error('Network Timeout'));

            await expect(gateway.createPreference({})).rejects.toThrow();
        });
    });

    describe('getPaymentDetails() method', () => {
        it('should fetch and return payment metadata correctly for a valid transaction ID', async () => {
            const mockPayment = { status: 'approved', external_reference: 'order-123' };
            (Payment.prototype.get as jest.Mock).mockResolvedValue(mockPayment);

            const result = await gateway.getPaymentDetails('pay-789');

            expect(result.status).toBe('approved');
            expect(result.external_reference).toBe('order-123');
        });

        it('should apply resilient default values when status or reference are missing in the response', async () => {
            (Payment.prototype.get as jest.Mock).mockResolvedValue({
                status: null,
                external_reference: undefined
            });

            const result = await gateway.getPaymentDetails('pay-789');

            expect(result.status).toBe('fail');
            expect(result.external_reference).toBe('');
        });

        it('should return a failure status instead of crashing when the SDK internal call fails', async () => {
            (Payment.prototype.get as jest.Mock).mockRejectedValue(new Error('Gateway Unreachable'));

            const result = await gateway.getPaymentDetails('pay-789');

            expect(result.status).toBe('fail');
        });
    });

    describe('getStatus() orchestration', () => {
        it('should extract only the status string from the full payment details', async () => {
            jest.spyOn(gateway, 'getPaymentDetails').mockResolvedValue({
                status: 'pending',
                external_reference: 'order-123'
            });

            const status = await gateway.getStatus('pay-789');

            expect(status).toBe('pending');
        });

        it('should throw a localized domain error when the detail lookup fails critically', async () => {
            jest.spyOn(gateway, 'getPaymentDetails').mockRejectedValue(new Error('Critical Infrastructure Failure'));

            await expect(gateway.getStatus('pay-789')).rejects.toThrow('Communication failure with the payment provider');
        });
    });
});