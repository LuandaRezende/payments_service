import { NotFoundException } from '@nestjs/common';
import { DeletePaymentUseCase } from './delete-payment.use-case';

describe('DeletePaymentUseCase', () => {
  let useCase: DeletePaymentUseCase;
  let repository: any;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      remove: jest.fn(), 
    };
    useCase = new DeletePaymentUseCase(repository);
  });

  describe('Execute Payment Deletion', () => {
    it('should successfully remove a payment record when a valid and existing ID is provided', async () => {
      const paymentId = '1';
      repository.findById.mockResolvedValue({ id: paymentId });
      repository.remove.mockResolvedValue(undefined);

      await expect(useCase.execute(paymentId)).resolves.not.toThrow();
      expect(repository.findById).toHaveBeenCalledWith(paymentId);
      expect(repository.remove).toHaveBeenCalledWith(paymentId);
    });

    it('should throw a NotFoundException and prevent removal if no payment record is found for the given ID', async () => {
      const invalidId = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(invalidId)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(invalidId);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});