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
    });
});