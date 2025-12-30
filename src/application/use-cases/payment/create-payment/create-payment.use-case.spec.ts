import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';

describe('CreatePaymentUseCase', () => {
    let useCase: CreatePaymentUseCase;

    let repositoryMock: {
        save: jest.Mock;
    };

    let paymentProviderMock: {
        createPreference: jest.Mock;
    };

    beforeEach(() => {
        repositoryMock = {
            save: jest.fn(),
        };

        paymentProviderMock = {
            createPreference: jest.fn(),
        };

        paymentProviderMock.createPreference.mockResolvedValue({
            init_point: 'http://mercadopago.com/checkout',
            external_reference: '1',
        });

        repositoryMock.save.mockResolvedValue({
            id: '1',
            status: PaymentStatus.PENDING,
        });

        useCase = new CreatePaymentUseCase(
            repositoryMock as any,
            paymentProviderMock as any,
        );
    });

    it('should create a payment with status PENDING by default', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 150.5,
            description: 'Pagamento Teste',
            paymentMethod: PaymentMethod.PIX,
        };

        repositoryMock.save.mockResolvedValue({
            id: '1',
            ...dto,
            status: PaymentStatus.PENDING,
            createdAt: new Date(),
        });

        const result = await useCase.execute(dto);

        expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should create a payment successfully', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 100,
            description: 'Test',
            paymentMethod: PaymentMethod.PIX,
        };

        const result = await useCase.execute(dto);

        expect(result).toBeDefined();
        expect(result.status).toBe(PaymentStatus.PENDING);
        expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should call payment provider when payment method is CREDIT_CARD', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 100,
            description: 'Test',
            paymentMethod: PaymentMethod.CREDIT_CARD,
        };

        repositoryMock.save.mockResolvedValue({
            id: '1',
            cpf: dto.cpf,
            amount: dto.amount,
            description: dto.description,
            paymentMethod: PaymentMethod.CREDIT_CARD, 
            status: PaymentStatus.PENDING,
            createdAt: new Date(),
        });

        await useCase.execute(dto);

        expect(paymentProviderMock.createPreference).toHaveBeenCalledTimes(1);
    });
});
