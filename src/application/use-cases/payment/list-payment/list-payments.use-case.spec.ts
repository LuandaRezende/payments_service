import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { ListPaymentsUseCase } from './list-payments.use-case';

describe('ListPaymentsUseCase', () => {
  let useCase: ListPaymentsUseCase;
  let repositoryMock: any;

  beforeEach(() => {
    repositoryMock = { 
      findByFilters: jest.fn().mockResolvedValue([{ id: '1', amount: 100 }]) 
    };
    useCase = new ListPaymentsUseCase(repositoryMock);
  });

  describe('Query Payment Records', () => {
    it('should retrieve a complete list of payment records when no search criteria are specified', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      repositoryMock.findByFilters.mockResolvedValue(mockData);

      const result = await useCase.execute({});

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockData);
      expect(repositoryMock.findByFilters).toHaveBeenCalledWith({});
    });

    it('should accurately propagate specific filters for CPF, Status, and Payment Method to the repository', async () => {
      const filters = {
        cpf: '12345678901',
        status: PaymentStatus.PAID,
        method: PaymentMethod.CREDIT_CARD
      };
      repositoryMock.findByFilters.mockResolvedValue([]);

      await useCase.execute(filters);

      expect(repositoryMock.findByFilters).toHaveBeenCalledWith(filters);
      expect(repositoryMock.findByFilters).toHaveBeenCalledTimes(1);
    });

    it('should return an empty collection gracefully when the filter criteria do not match any existing records', async () => {
      const filters = { cpf: '000.000.000-00' };
      repositoryMock.findByFilters.mockResolvedValue([]);

      const result = await useCase.execute(filters);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(repositoryMock.findByFilters).toHaveBeenCalledWith(filters);
    });
  });
});