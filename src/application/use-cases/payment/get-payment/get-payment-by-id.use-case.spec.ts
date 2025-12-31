import { NotFoundException } from '@nestjs/common';
import { GetPaymentByIdUseCase } from './get-payment-by-id.use-case';

describe('GetPaymentByIdUseCase', () => {
  let useCase: GetPaymentByIdUseCase;
  let repository: any;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    };
    useCase = new GetPaymentByIdUseCase(repository);
  });

  it('deve retornar um pagamento quando encontrado', async () => {
    const payment = { id: '1', amount: 100 };
    repository.findById.mockResolvedValue(payment);

    const result = await useCase.execute('1');
    expect(result).toEqual(payment);
  });

  it('deve lançar NotFoundException quando não encontrado', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
  });
});