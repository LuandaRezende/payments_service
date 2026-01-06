import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { BadRequestException } from '@nestjs/common';

describe('Unit Test: CreatePaymentUseCase', () => {
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
      start: jest.fn().mockResolvedValue({ workflowId: 'wf-123' }),
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

  describe('execute() implementation logic', () => {

    describe('when providing valid payment data', () => {
      it('should persist the payment record and return an initial PROCESSING status', async () => {
        const savedPayment = { id: 'p1', ...validPaymentDto, status: PaymentStatus.PENDING };
        repositoryMock.register.mockResolvedValue(savedPayment);

        const result = await useCase.execute(validPaymentDto);

        expect(result.status).toBe('PROCESSING');
        expect(mockTrx.commit).toHaveBeenCalled();
      });

      it('should enforce idempotency by tying the Workflow ID to the Payment Primary Key', async () => {
        const paymentId = 'unique-uuid-123';
        repositoryMock.register.mockResolvedValue({ ...validPaymentDto, id: paymentId });

        await useCase.execute(validPaymentDto);

        expect(temporalClientMock.start).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ workflowId: `payment-${paymentId}` })
        );
      });

      it('should propagate the exact persisted entity state to the Temporal orchestration layer', async () => {
        const fullSavedPayment = { id: 'p1', ...validPaymentDto };
        repositoryMock.register.mockResolvedValue(fullSavedPayment);

        await useCase.execute(validPaymentDto);

        expect(temporalClientMock.start).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ args: [fullSavedPayment] })
        );
      });
    });

    describe('when infrastructure or external services fail (Transaction Safety)', () => {
      it('should perform a full rollback of database changes if the repository layer fails', async () => {
        repositoryMock.register.mockRejectedValue(new Error('DB Error'));

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow('DB Error');
        expect(mockTrx.rollback).toHaveBeenCalled();
      });

      it('should ensure domain-specific exceptions are bubbled up without losing context during rollback', async () => {
        const customError = new BadRequestException('Business rule violation');
        repositoryMock.register.mockRejectedValue(customError);

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow(customError);
        expect(mockTrx.rollback).toHaveBeenCalled();
      });

      it('should prevent data inconsistency by rolling back DB changes if the Workflow fails to initialize', async () => {
        repositoryMock.register.mockResolvedValue({ id: 'p1', ...validPaymentDto });
        temporalClientMock.start.mockRejectedValue(new Error('Temporal Service Unavailable'));

        await expect(useCase.execute(validPaymentDto)).rejects.toThrow('Temporal Service Unavailable');
        expect(mockTrx.rollback).toHaveBeenCalled();
        expect(mockTrx.commit).not.toHaveBeenCalled();
      });
    });

    describe('when input data fails business constraints (Validation)', () => {
      it('should reject requests that lack a mandatory payment method', async () => {
        const { paymentMethod, ...invalidDto } = validPaymentDto;
        await expect(useCase.execute(invalidDto)).rejects.toThrow(BadRequestException);
      });

      it('should fail execution when domain invariants are violated, such as an invalid CPF format', async () => {
        await expect(useCase.execute({ ...validPaymentDto, cpf: '123' }))
          .rejects.toThrow('The provided CPF is invalid');
      });
    });
  });
});