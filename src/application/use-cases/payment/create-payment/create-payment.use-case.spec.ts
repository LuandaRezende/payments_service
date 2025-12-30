import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { CreatePaymentUseCase } from './create-payment.use-case';

describe('CreatePaymentUseCase', () => {
    let useCase: CreatePaymentUseCase;
    let repositoryMock: any;

    beforeEach(() => {
        repositoryMock = { save: jest.fn().mockResolvedValue({ id: '1', status: 'PENDING' }) };
        useCase = new CreatePaymentUseCase(repositoryMock);
    });

    it('should create a payment successfully', async () => {
        const input = { cpf: '76187209087', amount: 100, description: 'Test', paymentMethod: 'PIX' as any };
        const result = await useCase.execute(input);

        expect(result).toBeDefined();
        expect(result.status).toBe('PENDING');
        expect(repositoryMock.save).toHaveBeenCalled();
    });

    it('should create a payment with status PENDING by default', async () => {
        const dto = {
            cpf: '76187209087',
            amount: 150.5,
            description: 'Pagamento Teste',
            paymentMethod: PaymentMethod.PIX,
        };

        repositoryMock.save.mockResolvedValue({
            id: expect.any(String),
            ...dto,
            status: PaymentStatus.PENDING,
            createdAt: new Date(),
        });

        const result = await useCase.execute(dto);

        expect(result.id).toEqual(expect.any(String));
        expect(result.status).toBe(PaymentStatus.PENDING);
        expect(repositoryMock.save).toHaveBeenCalledTimes(1);
        expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({
            cpf: dto.cpf,
            amount: dto.amount
        }));
    });

    it('should throw an error if the repository fails to save', async () => {
        repositoryMock.save.mockRejectedValue(new Error('Bank Failure'));
        const dto = { cpf: '76187209087', amount: 10, description: 'err', paymentMethod: PaymentMethod.PIX };
        await expect(useCase.execute(dto)).rejects.toThrow('Bank Failure');
    });
});