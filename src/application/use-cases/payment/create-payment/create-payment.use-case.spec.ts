import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { BadRequestException } from '@nestjs/common';

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
  let repositoryMock: any;
  let temporalClientMock: any;
  let mockTrx: any;

  const validPaymentDto = {
    cpf: '45013098653',
    amount: 150.0,
    description: 'Test Payment',
    paymentMethod: PaymentMethod.PIX,
  };

  beforeEach(async () => {
    mockTrx = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    repositoryMock = {
      register: jest.fn(),
      startTransaction: jest.fn().mockResolvedValue(mockTrx),
    };

    temporalClientMock = {
      start: jest.fn().mockResolvedValue({
        workflowId: 'wf-123',
        result: jest.fn().mockResolvedValue({ url: 'http://checkout.com' })
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentUseCase,
        { provide: 'PaymentRepository', useValue: repositoryMock },
        { provide: 'TEMPORAL_CLIENT', useValue: temporalClientMock },
      ],
    }).compile();

    useCase = module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
    jest.clearAllMocks();

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    describe('Successful Scenarios', () => {
      it('should successfully register a payment and trigger the workflow', async () => {
        const savedPayment = { id: 'p1', ...validPaymentDto, status: PaymentStatus.PENDING };
        repositoryMock.register.mockResolvedValue(savedPayment);

        const result = await useCase.execute(validPaymentDto);

        expect(result.status).toBe('PROCESSING');
        expect(mockTrx.commit).toHaveBeenCalled();
        expect(temporalClientMock.start).toHaveBeenCalled();
      });

      it('should return a placeholder URL when the workflow does not provide a checkout link', async () => {
        repositoryMock.register.mockResolvedValue({ id: 'p1', ...validPaymentDto });
        temporalClientMock.start.mockResolvedValue({
          workflowId: 'wf-123',
          result: jest.fn().mockResolvedValue(null)
        });

        const result = await useCase.execute(validPaymentDto);
        expect(result.checkoutUrl).toBe('URL_NAO_GERADA');
      });
    });

    describe('Transaction Integrity & Error Handling', () => {
      it('should rollback the transaction when database registration fails', async () => {
        repositoryMock.register.mockRejectedValue(new Error('DB Error'));

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow('DB Error');
        expect(mockTrx.rollback).toHaveBeenCalled();
      });

      it('should rollback the transaction when temporal workflow fails to start', async () => {
        repositoryMock.register.mockResolvedValue({ id: 'p1', ...validPaymentDto });
        temporalClientMock.start.mockRejectedValue(new Error('Temporal Error'));

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow('Temporal Error');
        expect(mockTrx.rollback).toHaveBeenCalled();
      });

      it('should not attempt to rollback if the transaction was never initialized', async () => {
        repositoryMock.startTransaction.mockResolvedValue(null);
        repositoryMock.register.mockImplementation(() => { throw new Error('No Trx'); });

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow();
        expect(mockTrx.rollback).not.toHaveBeenCalled();
      });

      it('should prioritize and rethrow the original error even if rollback fails', async () => {
        repositoryMock.register.mockRejectedValue(new Error('Original Error'));
        mockTrx.rollback.mockRejectedValue(new Error('Rollback Error'));

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow();
      });
    });

    describe('Input Validation', () => {
      it('should reject requests that are missing a payment method', async () => {
        await expect(useCase.execute({ amount: 100 })).rejects.toThrow(BadRequestException);
      });

      it('should reject requests with an invalid CPF format', async () => {
        await expect(useCase.execute({ ...validPaymentDto, cpf: '123' }))
          .rejects.toThrow('The provided CPF is invalid');
      });
    });
  });
});