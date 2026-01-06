import { MockActivityEnvironment } from '@temporalio/testing';
import { PaymentActivities } from './activities';
import { PaymentStatus } from '../../../domain/entities/payment.entity';

describe('Temporal Activities: PaymentActivities', () => {
  let activitiesInstance: PaymentActivities;
  let repositoryMock: any;
  let providerMock: any;
  let env: MockActivityEnvironment;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    providerMock = {
      getStatus: jest.fn(),
    };

    activitiesInstance = new PaymentActivities(providerMock, repositoryMock);
    env = new MockActivityEnvironment();
  });

  describe('syncPaymentStatusWithGateway() implementation', () => {
    const runActivity = (id: string) =>
      env.run(activitiesInstance.syncPaymentStatusWithGateway.bind(activitiesInstance), id);

    it('should synchronize and persist the payment status when found in the gateway', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: '123',
        externalId: 'mp-999',
        status: PaymentStatus.PENDING,
      });
      providerMock.getStatus.mockResolvedValue('approved');

      const result = await runActivity('123');

      expect(repositoryMock.findById).toHaveBeenCalledWith('123');
      expect(providerMock.getStatus).toHaveBeenCalledWith('mp-999');
      expect(repositoryMock.updateStatus).toHaveBeenCalledWith('123', 'approved');
      expect(result).toBe('approved');
    });

    it('should fail with a descriptive error when the payment record lacks an external provider reference', async () => {
      repositoryMock.findById.mockResolvedValue({ id: '123', externalId: undefined });

      await expect(runActivity('123'))
        .rejects.toThrow('Payment 123 does not have an associated external ID.');

      expect(providerMock.getStatus).not.toHaveBeenCalled();
    });

    it('should propagate gateway timeouts to trigger Temporal automatic retry policy', async () => {
      repositoryMock.findById.mockResolvedValue({ id: '123', externalId: 'mp-999' });
      providerMock.getStatus.mockRejectedValue(new Error('Gateway Timeout'));

      await expect(runActivity('123')).rejects.toThrow('Gateway Timeout');
      expect(repositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it('should ensure consistency by returning the current status even if already synchronized', async () => {
      repositoryMock.findById.mockResolvedValue({
        id: '123',
        externalId: 'mp-999',
        status: 'approved'
      });
      providerMock.getStatus.mockResolvedValue('approved');

      const result = await runActivity('123');

      expect(result).toBe('approved');
    });

    it('should bubble up persistence failures when updating the state post-synchronization', async () => {
      repositoryMock.findById.mockResolvedValue({ id: '123', externalId: 'mp-999' });
      providerMock.getStatus.mockResolvedValue('approved');
      repositoryMock.updateStatus.mockRejectedValue(new Error('Database Update Error'));

      await expect(runActivity('123')).rejects.toThrow('Database Update Error');
    });
  });

  describe('markPaymentAsFailed() compensation logic', () => {
    const runMarkFailed = (id: string) =>
      env.run(activitiesInstance.markPaymentAsFailed.bind(activitiesInstance), id);

    it('should transition the payment status to FAIL within the persistence layer', async () => {
      await runMarkFailed('123');

      expect(repositoryMock.updateStatus).toHaveBeenCalledWith('123', PaymentStatus.FAIL);
    });

    it('should propagate connectivity issues to allow workflow orchestration to handle retries', async () => {
      repositoryMock.updateStatus.mockRejectedValue(new Error('Connection Error'));

      await expect(runMarkFailed('123')).rejects.toThrow('Connection Error');
    });
  });
});