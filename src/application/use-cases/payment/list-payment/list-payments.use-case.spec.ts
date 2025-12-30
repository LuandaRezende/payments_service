import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { ListPaymentsUseCase } from './list-payments.use-case';

describe('ListPaymentsUseCase', () => {
  let useCase: ListPaymentsUseCase;
  let repositoryMock: any;

  beforeEach(() => {
    repositoryMock = { search: jest.fn().mockResolvedValue([{ id: '1', amount: 100 }]) };
    useCase = new ListPaymentsUseCase(repositoryMock);
  });


  it('should list payments without filters', async () => {
    repositoryMock.search.mockResolvedValue([{ id: '1' }, { id: '2' }]);

    const result = await useCase.execute({});

    expect(result).toHaveLength(2);
    expect(repositoryMock.search).toHaveBeenCalledWith({});
  });

  it('should apply CPF and Status filters correctly', async () => {
    const filters = {
      cpf: '12345678901',
      status: PaymentStatus.PAID,
      method: PaymentMethod.CREDIT_CARD
    };

    repositoryMock.search.mockResolvedValue([]);

    await useCase.execute(filters);

    expect(repositoryMock.search).toHaveBeenCalledWith(filters);
  });

  it('should return an empty array when there are no results', async () => {
    repositoryMock.search.mockResolvedValue([]);

    const result = await useCase.execute({ cpf: '000' });

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});