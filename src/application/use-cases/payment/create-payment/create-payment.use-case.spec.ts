import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { BadRequestException } from '@nestjs/common';

describe('CreatePaymentUseCase', () => {
    let useCase: CreatePaymentUseCase;

    let repositoryMock: {
        register: jest.Mock;
    };

    let paymentProviderMock: {
        createPreference: jest.Mock;
    };

    beforeEach(() => {
        repositoryMock = {
            register: jest.fn(),
        };

        paymentProviderMock = {
            createPreference: jest.fn(),
        };

        paymentProviderMock.createPreference.mockResolvedValue({
            init_point: 'http://mercadopago.com/checkout',
            external_reference: '1',
        });

        repositoryMock.register.mockResolvedValue({
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

        repositoryMock.register.mockResolvedValue({
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
        expect(repositoryMock.register).toHaveBeenCalledTimes(1);
    });

    it('should call payment provider when payment method is CREDIT_CARD', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 100,
            description: 'Test',
            paymentMethod: PaymentMethod.CREDIT_CARD,
        };

        repositoryMock.register.mockResolvedValue({
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

    it('should throw InternalServerError if repository fails', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 100,
            description: 'Test Error',
            paymentMethod: PaymentMethod.PIX,
        };

        repositoryMock.register.mockRejectedValue(new Error('Persistence Error'));

        await expect(useCase.execute(dto)).rejects.toThrow();
    });

    it('should throw BadRequestException if paymentMethod is missing', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 100,
            description: 'Test',
        };

        await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    });
});
