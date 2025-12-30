import { UpdateStatusUseCase } from './update-status.use-case';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateStatusUseCase', () => {
  let useCase: UpdateStatusUseCase;
  let repositoryMock: any;
  let paymentProviderMock: any;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    paymentProviderMock = {
      getPaymentDetails: jest.fn(),
    };
    useCase = new UpdateStatusUseCase(repositoryMock, paymentProviderMock);
  });

  it('should successfully update the status manually', async () => {
    const id = 'existing-id';
    const status = PaymentStatus.PAID;

    const result = await useCase.execute(id, status);

    expect(repositoryMock.updateStatus).toHaveBeenCalledWith(id, status);
    expect(result.status).toBe(status);
  });

  it('should update status via webhook and check if payment exists', async () => {
    const externalId = 'mp-123';
    
    paymentProviderMock.getPaymentDetails.mockResolvedValue({
      status: 'approved',
      external_reference: 'internal-id',
    });

    repositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(externalId) 
    ).rejects.toThrow(NotFoundException);
  });

  it('should update status to PAID when Mercado Pago approves', async () => {
    const externalId = 'mp-123';
    
    paymentProviderMock.getPaymentDetails.mockResolvedValue({
      status: 'approved',
      external_reference: 'internal-id',
    });
    
    repositoryMock.findById.mockResolvedValue({ id: 'internal-id' });

    await useCase.execute(externalId);

    expect(repositoryMock.updateStatus).toHaveBeenCalledWith('internal-id', PaymentStatus.PAID);
  });
});