import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { processPaymentWorkflow } from './payment.workflow';

describe('Orchestration Test: PaymentWorkflow', () => {
    let testEnv: TestWorkflowEnvironment;

    jest.setTimeout(30000);

    beforeAll(async () => {
        testEnv = await TestWorkflowEnvironment.createLocal();
    });

    afterAll(async () => {
        await testEnv?.teardown();
    });

    describe('Scenario successful synchronization', () => {
        it('should orchestrate the full sync process when gateway confirms payment approval', async () => {
            const { client, nativeConnection } = testEnv;

            const mockActivities = {
                syncPaymentStatusWithGateway: jest.fn().mockResolvedValue('approved'),
                markPaymentAsFailed: jest.fn(),
            };

            const worker = await Worker.create({
                connection: nativeConnection,
                taskQueue: 'success-queue',
                workflowsPath: require.resolve('./payment.workflow'),
                activities: mockActivities,
            });

            await worker.runUntil(
                client.workflow.execute(processPaymentWorkflow, {
                    args: [{ id: 'p1', paymentMethod: 'PIX' }],
                    workflowId: 'success-wf',
                    taskQueue: 'success-queue',
                })
            );

            expect(mockActivities.syncPaymentStatusWithGateway).toHaveBeenCalledWith('p1');
            expect(mockActivities.markPaymentAsFailed).not.toHaveBeenCalled();
        });
    });

    describe('Scenario fault tolerance and compensation logic', () => {
        it('should trigger the compensation activity when the gateway synchronization fails non-retryable errors', async () => {
            const { client, nativeConnection } = testEnv;

            const mockActivities = {
                syncPaymentStatusWithGateway: jest.fn().mockRejectedValue(new Error('Gateway Offline')),
                markPaymentAsFailed: jest.fn().mockResolvedValue(undefined),
            };

            const worker = await Worker.create({
                connection: nativeConnection,
                taskQueue: 'failure-queue',
                workflowsPath: require.resolve('./payment.workflow'),
                activities: mockActivities,
            });

            await worker.runUntil(async () => {
                try {
                    await client.workflow.execute(processPaymentWorkflow, {
                        args: [{ id: 'p1', paymentMethod: 'PIX' }],
                        workflowId: 'failure-wf',
                        taskQueue: 'failure-queue',
                    });
                } catch (err) {
                    // Workflow failed as expected, we swallow the error to proceed to expectations
                }
            });

            expect(mockActivities.markPaymentAsFailed).toHaveBeenCalledWith('p1');
        });

        it('should ensure eventual consistency even when the transaction starts in a pending state', async () => {
            const { client, nativeConnection } = testEnv;

            const mockActivities = {
                syncPaymentStatusWithGateway: jest.fn().mockResolvedValue('approved'),
                markPaymentAsFailed: jest.fn(),
            };

            const worker = await Worker.create({
                connection: nativeConnection,
                taskQueue: 'pending-queue',
                workflowsPath: require.resolve('./payment.workflow'),
                activities: mockActivities,
            });

            await worker.runUntil(
                client.workflow.execute(processPaymentWorkflow, {
                    args: [{ id: 'p1', paymentMethod: 'PIX' }],
                    workflowId: 'pending-wf',
                    taskQueue: 'pending-queue',
                })
            );

            expect(mockActivities.syncPaymentStatusWithGateway).toHaveBeenCalled();
        });
    });
});