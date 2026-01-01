import { UpdateStatusUseCase } from './update-status.use-case';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateStatusUseCase', () => {
    let useCase: UpdateStatusUseCase;
    let repositoryMock: any;
    let paymentProviderMock: any;

    beforeEach(() => {
        repositoryMock = {
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };
        paymentProviderMock = {
            getPaymentDetails: jest.fn(),
        };
        useCase = new UpdateStatusUseCase(repositoryMock, paymentProviderMock);
    });

    describe('Manual Status Update', () => {
        it('should successfully update the payment state when a valid ID and new status are provided', async () => {
            const id = 'existing-id';
            const status = PaymentStatus.PAID;

            repositoryMock.findById.mockResolvedValue({
                id: id,
                status: PaymentStatus.PENDING,
                cpf: '12345678909',
                amount: 150.50,
            });

            const result = await useCase.execute(id, status);

            expect(repositoryMock.findById).toHaveBeenCalledWith(id);
            expect(repositoryMock.updateStatus).toHaveBeenCalledWith(id, status);
            expect(result.status).toBe(status);
            expect(result.id).toBe(id);
        });

        it('should throw NotFoundException when attempting to update a non-existent payment record', async () => {
            repositoryMock.findById.mockResolvedValue(null);

            await expect(useCase.execute('invalid-id', PaymentStatus.PAID))
                .rejects
                .toThrow(NotFoundException);
        });
    });

    describe('Webhook Integration & Status Mapping', () => {
        const internalId = 'internal-id';
        const mpId = 'mp-123';

        it('should throw NotFoundException when the external provider reference does not match any local record', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'approved',
                external_reference: 'internal-id',
            });

            repositoryMock.findById.mockResolvedValue(null);

            await expect(useCase.execute(mpId)).rejects.toThrow(NotFoundException);
        });

        it('should transition payment state to PAID when the external provider confirms approval', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'approved',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({ id: internalId });

            await useCase.execute(mpId);

            expect(repositoryMock.updateStatus).toHaveBeenCalledWith(internalId, PaymentStatus.PAID);
        });

        it('should transition payment state to FAIL when the transaction is rejected by the provider', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'rejected',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({ id: internalId, status: PaymentStatus.PENDING });

            const result = await useCase.execute(mpId);
            
            expect(result.status).toBe(PaymentStatus.FAIL);
        });

        it('should transition payment state to FAIL when the transaction is cancelled by the provider', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'cancelled',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({ id: internalId, status: PaymentStatus.PENDING });

            const result = await useCase.execute(mpId);

            expect(result.status).toBe(PaymentStatus.FAIL);
        });

        it('should maintain PENDING state when the provider reports the transaction as in_process', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'in_process',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({ id: internalId, status: PaymentStatus.PENDING });

            const result = await useCase.execute(mpId);

            expect(result.status).toBe(PaymentStatus.PENDING);
        });

        it('should maintain PENDING state as a safe fallback when receiving an unknown status from the provider', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'unknown_status_from_mp',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({ id: internalId, status: PaymentStatus.PENDING });

            const result = await useCase.execute(mpId);

            expect(result.status).toBe(PaymentStatus.PENDING);
        });

        it('should explicitly map "pending" provider status to internal PENDING state', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'pending',
                external_reference: internalId,
            });
            repositoryMock.findById.mockResolvedValue({ id: internalId });
            const result = await useCase.execute(mpId);

            expect(result.status).toBe(PaymentStatus.PENDING);
        });
    });

    describe('Fault Tolerance & Error Handling', () => {
        it('should propagate generic errors when the persistence layer fails to retrieve a record', async () => {
            const id = 'any-id';
            repositoryMock.findById.mockRejectedValue(new Error('Unexpected Database Crash'));

            await expect(useCase.execute(id, PaymentStatus.PAID))
                .rejects
                .toThrow();
        });

        it('should throw an error and interrupt the flow if the status update persistence fails', async () => {
            const id = 'any-id';
            repositoryMock.findById.mockResolvedValue({ id, status: PaymentStatus.PENDING });
            repositoryMock.updateStatus.mockRejectedValue(new Error('Database failure'));

            await expect(useCase.execute(id, PaymentStatus.PAID))
                .rejects
                .toThrow('Database failure');
        });

        it('should return a consistent data transfer object after a successful asynchronous webhook update', async () => {
            const internalId = 'internal-uuid';

            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'approved',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({
                id: internalId,
                status: PaymentStatus.PENDING
            });

            const result = await useCase.execute('mp-123');

            expect(result).toEqual({ id: internalId, status: PaymentStatus.PAID });
            expect(repositoryMock.updateStatus).toHaveBeenCalledWith(internalId, PaymentStatus.PAID);
        });
    });
});