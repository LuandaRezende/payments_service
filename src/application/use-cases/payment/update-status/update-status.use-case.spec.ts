import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import { UpdateStatusUseCase } from './update-status.use-case';
import { NotFoundException } from '@nestjs/common';

describe('UpdateStatusUseCase', () => {
  let useCase: UpdateStatusUseCase;
  let repositoryMock: any;

  beforeEach(() => {
    repositoryMock = { 
      findById: jest.fn().mockResolvedValue({ id: '1', status: 'PENDING' }),
      updateStatus: jest.fn().mockResolvedValue(true) 
    };
    useCase = new UpdateStatusUseCase(repositoryMock);
  });

  it('should successfully update the status', async () => {
    const id = 'existing-id';
    // Simula que o pagamento existe
    repositoryMock.findById.mockResolvedValue({ id, status: PaymentStatus.PENDING });
    repositoryMock.updateStatus.mockResolvedValue(true);

    await useCase.execute(id, PaymentStatus.PAID);

    expect(repositoryMock.findById).toHaveBeenCalledWith(id);
    expect(repositoryMock.updateStatus).toHaveBeenCalledWith(id, PaymentStatus.PAID);
  });

  it('should throw NotFoundException if the payment does not exist', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('invalid-id', PaymentStatus.PAID)
    ).rejects.toThrow(NotFoundException);

    // Garante que o updateStatus NÃO foi chamado se não encontrou o ID
    expect(repositoryMock.updateStatus).not.toHaveBeenCalled();
  });

  it('should propagate errors if updateStatus fails', async () => {
    repositoryMock.findById.mockResolvedValue({ id: '1' });
    repositoryMock.updateStatus.mockRejectedValue(new Error('Writing error'));

    await expect(
      useCase.execute('1', PaymentStatus.PAID)
    ).rejects.toThrow('Writing error');
  });
});