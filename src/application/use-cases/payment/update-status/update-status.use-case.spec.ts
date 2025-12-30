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

    it('should successfully update the status manually', async () => {
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

    it('should update status via webhook and check if payment exists', async () => {
        const externalId = 'mp-123';

        paymentProviderMock.getPaymentDetails.mockResolvedValue({
            status: 'approved',
            external_reference: 'internal-id',
        });

        repositoryMock.findById.mockResolvedValue(null);

        await expect(
            useCase.execute(externalId)
        ).rejects.toThrow(NotFoundException);
    });

    it('should update status to PAID when Mercado Pago approves', async () => {
        const externalId = 'mp-123';

        paymentProviderMock.getPaymentDetails.mockResolvedValue({
            status: 'approved',
            external_reference: 'internal-id',
        });

        repositoryMock.findById.mockResolvedValue({ id: 'internal-id' });

        await useCase.execute(externalId);

        expect(repositoryMock.updateStatus).toHaveBeenCalledWith('internal-id', PaymentStatus.PAID);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        await expect(useCase.execute('invalid-id', PaymentStatus.PAID))
            .rejects
            .toThrow(NotFoundException);
    });

    describe('mapStatus and Webhook Branching', () => {
        const internalId = 'internal-id';
        const mpId = 'mp-123456';

        beforeEach(() => {
            repositoryMock.findById.mockResolvedValue({ id: internalId, status: PaymentStatus.PENDING });
        });

        it('should map "rejected" to PaymentStatus.FAIL', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'rejected',
                external_reference: internalId,
            });

            const result = await useCase.execute(mpId);
            expect(result.status).toBe(PaymentStatus.FAIL);
        });

        it('should map "cancelled" to PaymentStatus.FAIL', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'cancelled',
                external_reference: internalId,
            });

            const result = await useCase.execute(mpId);
            expect(result.status).toBe(PaymentStatus.FAIL);
        });

        it('should map "in_process" to PaymentStatus.PENDING', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'in_process',
                external_reference: internalId,
            });

            const result = await useCase.execute(mpId);
            expect(result.status).toBe(PaymentStatus.PENDING);
        });

        it('should map any unknown status to PaymentStatus.PENDING (default branch)', async () => {
            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'unknown_status_from_mp',
                external_reference: internalId,
            });

            const result = await useCase.execute(mpId);
            expect(result.status).toBe(PaymentStatus.PENDING);
        });

        it('should throw InternalServerError when an unexpected error occurs', async () => {
            const id = 'any-id';

            repositoryMock.findById.mockRejectedValue(new Error('Unexpected Database Crash'));

            await expect(useCase.execute(id, PaymentStatus.PAID))
                .rejects
                .toThrow();
        });

        it('should throw an error when an unexpected error occurs during update', async () => {
            const id = 'any-id';

            repositoryMock.findById.mockResolvedValue({
                id,
                status: PaymentStatus.PENDING
            });

            repositoryMock.updateStatus.mockRejectedValue(new Error('Database failure'));

            await expect(useCase.execute(id, PaymentStatus.PAID))
                .rejects
                .toThrow('Database failure');
        });

        it('should return the correct object after a successful webhook update', async () => {
            const mpId = 'mp-123';
            const internalId = 'internal-uuid';

            paymentProviderMock.getPaymentDetails.mockResolvedValue({
                status: 'approved',
                external_reference: internalId,
            });

            repositoryMock.findById.mockResolvedValue({
                id: internalId,
                status: PaymentStatus.PENDING
            });

            const result = await useCase.execute(mpId);

            expect(result).toEqual({ id: internalId, status: PaymentStatus.PAID });
            expect(repositoryMock.updateStatus).toHaveBeenCalledWith(internalId, PaymentStatus.PAID);
        });
    });

    it('should map "pending" to PaymentStatus.PENDING', async () => {
        const mpId = 'mp-123';
        const internalId = 'internal-id';
        paymentProviderMock.getPaymentDetails.mockResolvedValue({
            status: 'pending',
            external_reference: internalId,
        });
        repositoryMock.findById.mockResolvedValue({ id: internalId });

        const result = await useCase.execute(mpId);
        expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw an error if updateStatus fails (final branch)', async () => {
        const id = 'any-id';
        repositoryMock.findById.mockResolvedValue({ id, status: PaymentStatus.PENDING });

        repositoryMock.updateStatus.mockRejectedValue(new Error('Final operation failed'));

        await expect(useCase.execute(id, PaymentStatus.PAID))
            .rejects
            .toThrow('Final operation failed');
    });
});