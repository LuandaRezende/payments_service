import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreatePaymentUseCase } from '../src/application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../src/application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../src/application/use-cases/payment/update-status/update-status.use-case';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CreatePaymentUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({
          id: 'payment-123',
          amount: 100,
          status: 'PENDING',
          init_point: 'https://fake-link',
        }),
      })
      .overrideProvider(ListPaymentsUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue([]),
      })
      .overrideProvider(UpdateStatusUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({
          id: 'payment-123',
          status: 'PAID',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/payments - cria pagamento', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .send({
        amount: 100,
        description: 'Pagamento teste',
        cpf: '12345678900',
        method: 'PIX',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('init_point');
    expect(response.body).toHaveProperty('status', 'PENDING');
  });

  it('GET /api/payments - lista pagamentos', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/payments');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('PATCH /api/payments/:id/status - atualiza status', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/payments/payment-123/status')
      .send({ status: 'PAID' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'PAID');
  });

  it('POST /api/payments/webhook - recebe webhook', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/payments/webhook?topic=payment')
      .send({
        data: { id: 'payment-123' },
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ received: true });
  });
});
