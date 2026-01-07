import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreatePaymentUseCase } from '../src/application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../src/application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../src/application/use-cases/payment/update-status/update-status.use-case';
import { GetPaymentByIdUseCase } from '../src/application/use-cases/payment/get-payment/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../src/application/use-cases/payment/delete-payment/delete-payment.use-case';

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
      .overrideProvider(GetPaymentByIdUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({ id: 'payment-123', status: 'PENDING' }),
      })
      .overrideProvider(DeletePaymentUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/payment', () => {
    it('should initialize a new payment and return 201 Created', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payment')
        .send({
          amount: 100,
          description: 'E2E Test Payment',
          cpf: '12345678900',
          method: 'PIX',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('init_point');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });
  });

  describe('GET /api/payment', () => {
    it('should retrieve a list of payments and return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/payment');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/payment/webhook', () => {
    it('should process gateway notifications and return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payment/webhook?topic=payment')
        .send({
          data: { id: 'payment-123' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(String),
        status: 'PAID'
      });
    });
  });

  describe('DELETE /api/payment/:id', () => {
    it('should remove a payment record and return 204 No Content', async () => {
      const validUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

      const response = await request(app.getHttpServer())
        .delete(`/api/payment/${validUuid}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });
});