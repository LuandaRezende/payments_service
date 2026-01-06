import { proxyActivities } from '@temporalio/workflow';
import { PaymentActivities } from '../../infrastructure/temporal/activities/activities';

const {
  syncPaymentStatusWithGateway,
  markPaymentAsFailed
} = proxyActivities<PaymentActivities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

export async function processPaymentWorkflow(paymentData: any): Promise<void> {
  if (paymentData.paymentMethod === 'CREDIT_CARD' || paymentData.paymentMethod === 'PIX') {
    try {
      await syncPaymentStatusWithGateway(paymentData.id);
    } catch (error) {
      await markPaymentAsFailed(paymentData.id);
      throw error;
    }
  }
}