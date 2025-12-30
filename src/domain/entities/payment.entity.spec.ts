import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

jest.mock('cpf-cnpj-validator', () => ({
    cpf: {
        isValid: jest.fn(),
        strip: jest.fn((val) => val.replace(/[^\d]/g, '')),
    },
}));

describe('Payment Entity', () => {
    const validProps = {
        cpf: '12345678901',
        description: 'Pedido de Teste',
        amount: 100.0,
        paymentMethod: PaymentMethod.PIX,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a valid payment and strip CPF formatting', () => {
        (cpfValidator.isValid as jest.Mock).mockReturnValue(true);

        const payment = Payment.create({
            ...validProps,
            cpf: '123.456.789-01',
        });

        expect(payment.id).toBeDefined();
        expect(payment.cpf).toBe('12345678901');
        expect(payment.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw error if amount is zero or negative', () => {
        expect(() => {
            Payment.create({ ...validProps, amount: 0 });
        }).toThrow('O valor do pagamento deve ser maior que zero');
    });

    it('should throw error if CPF is invalid', () => {
        (cpfValidator.isValid as jest.Mock).mockReturnValue(false);

        expect(() => {
            Payment.create({ ...validProps });
        }).toThrow('CPF informado é inválido');
    });

    it('should throw error if description is empty', () => {
        (cpfValidator.isValid as jest.Mock).mockReturnValue(true);

        expect(() => {
            Payment.create({ ...validProps, description: '' });
        }).toThrow('A descrição é obrigatória');

        expect(() => {
            Payment.create({ ...validProps, description: '   ' });
        }).toThrow('A descrição é obrigatória');
    });
});