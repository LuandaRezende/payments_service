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

  it('deve remover um pagamento com sucesso', async () => {
    repository.findById.mockResolvedValue({ id: '1' });
    repository.remove.mockResolvedValue(undefined);

    await expect(useCase.execute('1')).resolves.not.toThrow();
    expect(repository.remove).toHaveBeenCalledWith('1');
  });

  it('deve lançar erro se o pagamento não existir', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id')).rejects.toThrow(NotFoundException);
    expect(repository.remove).not.toHaveBeenCalled();
  });
});