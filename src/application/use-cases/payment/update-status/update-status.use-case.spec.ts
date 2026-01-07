import { Test, TestingModule } from '@nestjs/testing';
import { UpdateStatusUseCase } from './update-status.use-case';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateStatusUseCase', () => {
  let useCase: UpdateStatusUseCase;
  let repositoryMock: {
    findById: jest.Mock;
    updateStatus: jest.Mock;
  };
  let paymentProviderMock: {
    getRealPaymentStatus: jest.Mock;
  };
  let signalMock: jest.Mock;
  let temporalClientMock: any;

  beforeEach(async () => {
    signalMock = jest.fn().mockResolvedValue(undefined);

    repositoryMock = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    paymentProviderMock = {
      getRealPaymentStatus: jest.fn(),
    };

    temporalClientMock = {
      workflow: {
        getHandle: jest.fn().mockReturnValue({
          signal: signalMock,
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStatusUseCase,
        { provide: 'PaymentRepository', useValue: repositoryMock },
        { provide: 'PaymentProvider', useValue: paymentProviderMock },
        { provide: 'TEMPORAL_CLIENT', useValue: temporalClientMock },
      ],
    }).compile();

    useCase = module.get<UpdateStatusUseCase>(UpdateStatusUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('Manual Status Updates', () => {
      it('should update payment status manually and send a signal to Temporal', async () => {
        const id = '123';
        const status = PaymentStatus.PAID;

        repositoryMock.findById.mockResolvedValue({ id });
        repositoryMock.updateStatus.mockResolvedValue(undefined);
        const logSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await useCase.execute(id, status);

        expect(result).toEqual({ id, status });
        expect(repositoryMock.updateStatus).toHaveBeenCalledWith(id, status);
        expect(signalMock).toHaveBeenCalledWith('paymentResult', { status });

        logSpy.mockRestore();
      });

      it('should throw NotFoundException if the payment record is missing during manual update', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        await expect(
          useCase.execute('any-id', PaymentStatus.PAID),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('Gateway Webhook Integration', () => {
      it('should synchronize local status with the gateway provider status', async () => {
        paymentProviderMock.getRealPaymentStatus.mockResolvedValue({
          status: 'approved',
          external_reference: 'internal-id',
        });
        repositoryMock.findById.mockResolvedValue({ id: 'internal-id' });

        const result = await useCase.execute('gateway-id');

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(repositoryMock.updateStatus).toHaveBeenCalledWith('internal-id', PaymentStatus.PAID);
      });

      it('should throw NotFoundException when the gateway reference does not match any local record', async () => {
        paymentProviderMock.getRealPaymentStatus.mockResolvedValue({
          status: 'approved',
          external_reference: 'unknown-id',
        });
        repositoryMock.findById.mockResolvedValue(null);

        await expect(useCase.execute('gateway-id')).rejects.toThrow(NotFoundException);
      });

      it('should correctly map all provider statuses to internal PaymentStatus', async () => {
        const statusMap = [
          ['approved', PaymentStatus.PAID],
          ['rejected', PaymentStatus.FAIL],
          ['cancelled', PaymentStatus.FAIL],
          ['pending', PaymentStatus.PENDING],
          ['in_process', PaymentStatus.PENDING],
          ['unknown_code', PaymentStatus.PENDING],
        ] as const;

        for (const [providerStatus, expectedInternalStatus] of statusMap) {
          paymentProviderMock.getRealPaymentStatus.mockResolvedValue({
            status: providerStatus,
            external_reference: 'id',
          });
          repositoryMock.findById.mockResolvedValue({ id: 'id' });

          const result = await useCase.execute('gateway-id');
          expect(result.status).toBe(expectedInternalStatus);
        }
      });
    });

    describe('Resilience & External Failures', () => {
      it('should gracefully handle Temporal signal failures without breaking the main flow', async () => {
        repositoryMock.findById.mockResolvedValue({ id: '123' });
        signalMock.mockRejectedValue(new Error('Temporal Service Unavailable'));
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await useCase.execute('123', PaymentStatus.PAID);

        expect(result.status).toBe(PaymentStatus.PAID);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Temporal]'),
          'Temporal Service Unavailable',
        );

        warnSpy.mockRestore();
      });
    });
  });
});

