import { proxyActivities, RetryPolicy } from '@temporalio/workflow';
import type { PaymentActivities } from '../../infrastructure/temporal/activities/activities';

const defaultRetryPolicy: RetryPolicy = {
  initialInterval: '1 second',
  maximumInterval: '1 minute',
  backoffCoefficient: 2,
  maximumAttempts: 5,
};

const {
  createExternalPreference,
  syncPaymentStatusWithGateway,
  markPaymentAsFailed
} = proxyActivities<PaymentActivities>({
  startToCloseTimeout: '1 minute',
  retry: defaultRetryPolicy,
});

export async function processPaymentWorkflow(paymentData: any): Promise<{ url: string }> {
  try {
    if (paymentData.paymentMethod === 'CREDIT_CARD') {
      const { id: externalId, url } = await createExternalPreference(paymentData.id);
      await syncPaymentStatusWithGateway(paymentData.id, externalId);

      return { url };
    }

    return { url: '' };
  } catch (error) {
    await markPaymentAsFailed(paymentData.id);
    throw error;
  }
}