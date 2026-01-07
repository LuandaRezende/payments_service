import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger } from '@temporalio/worker';
import { processPaymentWorkflow } from './payment.workflow';

try {
  Runtime.install({ logger: new DefaultLogger('ERROR') });
} catch (e) {}

describe('PaymentWorkflow Orchestration', () => {
  let testEnv: TestWorkflowEnvironment;

  // Increased timeout due to local Temporal environment startup
  jest.setTimeout(150000);

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.teardown();
    }
    jest.restoreAllMocks();
  });

  describe('Process Payment Saga', () => {

    it('should trigger the compensation activity (mark as failed) when gateway synchronization fails', async () => {
      const { client, nativeConnection } = testEnv;
      const taskQueue = `test-queue-${Date.now()}`;

      const mockActivities = {
        createExternalPreference: jest.fn().mockResolvedValue({
          id: 'ext-123',
          url: 'http://checkout.com'
        }),
        syncPaymentStatusWithGateway: jest.fn().mockRejectedValue(new Error('Gateway Offline')),
        markPaymentAsFailed: jest.fn().mockResolvedValue(undefined),
      };

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./payment.workflow'),
        activities: mockActivities,
      });

      const workerPromise = worker.run();

      try {
        await client.workflow.execute(processPaymentWorkflow, {
          args: [{ id: 'p1', paymentMethod: 'CREDIT_CARD' }],
          workflowId: `test-wf-${Date.now()}`,
          taskQueue,
          retry: { maximumAttempts: 1 }
        });
      } catch (err) {
      } finally {
        worker.shutdown();
        await workerPromise;
      }

      expect(mockActivities.createExternalPreference).toHaveBeenCalled();
      expect(mockActivities.markPaymentAsFailed).toHaveBeenCalledWith('p1');
    });
  });
});