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

  describe('Fetch Payment Details', () => {
    it('should accurately retrieve and return the payment domain entity when a valid unique identifier is provided', async () => {
      const mockPayment = { 
        id: '1', 
        amount: 100, 
        cpf: '12345678901', 
        status: 'PENDING' 
      };
      repository.findById.mockResolvedValue(mockPayment);

      const result = await useCase.execute('1');

      expect(result).toEqual(mockPayment);
      expect(repository.findById).toHaveBeenLastCalledWith('1');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should enforce data integrity by throwing a NotFoundException if the requested ID has no corresponding record in the persistence layer', async () => {
      const nonExistentId = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(nonExistentId))
        .rejects
        .toThrow(NotFoundException);
        
      expect(repository.findById).toHaveBeenCalledWith(nonExistentId);
    });
  });
});