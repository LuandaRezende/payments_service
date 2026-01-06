import { proxyActivities } from '@temporalio/workflow';
import type { PaymentActivities } from '../../infrastructure/temporal/activities/activities';

const {
  createExternalPreference,
  syncPaymentStatusWithGateway,
  markPaymentAsFailed
} = proxyActivities<PaymentActivities>({
  startToCloseTimeout: '1 minute',
});

export async function processPaymentWorkflow(paymentData: any): Promise<{ url: string }> {
  try {
    if (paymentData.paymentMethod === 'CREDIT_CARD') {

      const { id: externalId, url } = await createExternalPreference(paymentData.id);
      await syncPaymentStatusWithGateway(paymentData.id, externalId);
      return { url };
    }

    if (paymentData.paymentMethod === 'PIX') {
      return { url: '' };
    }

    return { url: '' };

  } catch (error) {
    await markPaymentAsFailed(paymentData.id);
    throw error;
  }
}