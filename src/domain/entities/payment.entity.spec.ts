import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

jest.mock('cpf-cnpj-validator', () => ({
    cpf: {
        isValid: jest.fn(),
        strip: jest.fn((val: string) => val.replace(/[^\d]/g, '')),
    },
}));

describe('Domain unit test payment entity', () => {
    const validPaymentProps = {
        cpf: '45013098653',
        description: 'standard test purchase',
        amount: 150.0,
        paymentMethod: PaymentMethod.PIX,
    };

    const mockedValidator = cpfValidator as jest.Mocked<typeof cpfValidator>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Creation logic success scenarios', () => {
        it('should successfully instantiate a payment entity with sanitized CPF and default status', () => {
            mockedValidator.isValid.mockReturnValue(true);

            const payment = Payment.create({
                ...validPaymentProps,
                cpf: '450.130.986-53',
            });

            expect(payment.id).toBeDefined();
            expect(payment.cpf).toBe('45013098653');
            expect(payment.status).toBe(PaymentStatus.PENDING);
            expect(payment.amount).toBe(150.0);
        });

        it('should ensure distinct UUID generation for concurrent instances (Identity Invariant)', () => {
            mockedValidator.isValid.mockReturnValue(true);

            const instanceOne = Payment.create(validPaymentProps);
            const instanceTwo = Payment.create(validPaymentProps);

            expect(instanceOne.id).not.toEqual(instanceTwo.id);
        });
    });

    describe('Domain validation invariants', () => {
        it('should reject non-positive amounts (Zero or Negative values)', () => {
            const expectedError = 'Payment amount must be greater than zero';

            expect(() => {
                Payment.create({ ...validPaymentProps, amount: 0 });
            }).toThrow(expectedError);

            expect(() => {
                Payment.create({ ...validPaymentProps, amount: -1 });
            }).toThrow(expectedError);
        });

        it('should throw a domain exception when the CPF validator returns false', () => {
            mockedValidator.isValid.mockReturnValue(false);

            expect(() => {
                Payment.create(validPaymentProps);
            }).toThrow('The provided CPF is invalid');
        });

        it('should reject empty or purely whitespace strings as payment descriptions', () => {
            mockedValidator.isValid.mockReturnValue(true);
            const expectedError = 'Description is required and cannot be empty';

            expect(() => {
                Payment.create({ ...validPaymentProps, description: '' });
            }).toThrow(expectedError);

            expect(() => {
                Payment.create({ ...validPaymentProps, description: '   ' });
            }).toThrow(expectedError);
        });
    });
});