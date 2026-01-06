import { Worker } from '@temporalio/worker';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PaymentActivities } from './activities/activities';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const activities = app.get(PaymentActivities);

  const worker = await Worker.create({
    workflowsPath: require.resolve('../../application/workflows/payment.workflow'),
    activities: {
      createExternalPreference: activities.createExternalPreference.bind(activities),
      syncPaymentStatusWithGateway: activities.syncPaymentStatusWithGateway.bind(activities),
      markPaymentAsFailed: activities.markPaymentAsFailed.bind(activities),
    },
    taskQueue: 'payments-queue',
  });

  console.log('Temporal worker is starting...');

  try {
    await worker.run();
  } catch (err) {
    console.error('Worker failed to start:', err);
    process.exit(1);
  }
}

run();