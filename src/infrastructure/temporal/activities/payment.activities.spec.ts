import { MockActivityEnvironment } from '@temporalio/testing';
import { PaymentActivities } from './activities';
import { PaymentStatus } from '../../../domain/entities/payment.entity';
import { Runtime, DefaultLogger } from '@temporalio/worker';

describe('PaymentActivities', () => {
  let activitiesInstance: PaymentActivities;
  let repositoryMock: any;
  let providerMock: any;
  let env: MockActivityEnvironment;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateExternalId: jest.fn(),
    };
    providerMock = {
      getStatus: jest.fn(),
      createPreference: jest.fn(),
    };

    activitiesInstance = new PaymentActivities(providerMock, repositoryMock);
    env = new MockActivityEnvironment();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('syncPaymentStatusWithGateway', () => {
    const runActivity = (id: string, extId: string) =>
      env.run(activitiesInstance.syncPaymentStatusWithGateway.bind(activitiesInstance), id, extId);

    it('should synchronize the status from the gateway and persist it locally', async () => {
      const paymentId = '123';
      const externalId = 'mp-999';

      repositoryMock.findById.mockResolvedValue({
        id: paymentId,
        status: PaymentStatus.PENDING,
      });
      providerMock.getStatus.mockResolvedValue('approved');

      const result = await runActivity(paymentId, externalId);

      expect(repositoryMock.findById).toHaveBeenCalledWith(paymentId);
      expect(providerMock.getStatus).toHaveBeenCalledWith(externalId);
      expect(repositoryMock.updateStatus).toHaveBeenCalledWith(paymentId, 'approved');
      expect(result).toBe('approved');
    });

    it('should propagate gateway errors to enable Temporal auto-retry policy', async () => {
      repositoryMock.findById.mockResolvedValue({ id: '123' });
      providerMock.getStatus.mockRejectedValue(new Error('Gateway Timeout'));

      await expect(runActivity('123', 'mp-999')).rejects.toThrow('Gateway Timeout');
      expect(repositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw an error when the database fails to update after a successful sync', async () => {
      repositoryMock.findById.mockResolvedValue({ id: '123' });
      providerMock.getStatus.mockResolvedValue('approved');
      repositoryMock.updateStatus.mockRejectedValue(new Error('Database Update Error'));

      await expect(runActivity('123', 'mp-999')).rejects.toThrow('Database Update Error');
    });
  });

  describe('markPaymentAsFailed', () => {
    const runMarkFailed = (id: string) =>
      env.run(activitiesInstance.markPaymentAsFailed.bind(activitiesInstance), id);

    it('should transition the local payment status to FAIL', async () => {
      const paymentId = '123';

      await runMarkFailed(paymentId);

      expect(repositoryMock.updateStatus).toHaveBeenCalledWith(paymentId, PaymentStatus.FAIL);
    });
  });
});