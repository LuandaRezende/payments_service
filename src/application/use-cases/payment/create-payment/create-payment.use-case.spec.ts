import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentMethod, PaymentStatus } from '../../../../domain/entities/payment.entity';
import { BadRequestException } from '@nestjs/common';
import { MercadoPagoErrorMapper } from '../../../../infrastructure/gateways/mercado-pago/mercado-pago-error.mapper';
import { PaymentProviderException } from '../../../../domain/exceptions/payment-provider.exception';

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
  let repositoryMock: any;
  let paymentProviderMock: any;

  const mockTrx = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    repositoryMock = {
      register: jest.fn(),
      startTransaction: jest.fn().mockResolvedValue(mockTrx),
    };
    paymentProviderMock = {
      createPreference: jest.fn(),
    };
    useCase = new CreatePaymentUseCase(repositoryMock, paymentProviderMock);
    jest.clearAllMocks();
  });

  describe('Execute Payment Process', () => {
    it('should rollback transaction and throw PaymentProviderException when gateway communication fails', async () => {
      const dto = {
        cpf: '76187209087',
        amount: 100,
        description: 'Error',
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      repositoryMock.register.mockResolvedValue({ id: '1', ...dto, status: PaymentStatus.PENDING });
      paymentProviderMock.createPreference.mockRejectedValue({ code: 'some_error' });

      await expect(useCase.execute(dto)).rejects.toThrow(PaymentProviderException);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });

    it('should integrate with payment provider and return checkout details for PIX transactions', async () => {
      const dto = {
        cpf: '76187209087',
        amount: 100,
        description: 'Test PIX',
        paymentMethod: PaymentMethod.PIX,
      };

      repositoryMock.register.mockResolvedValue({ id: '1', ...dto, status: PaymentStatus.PENDING });
      paymentProviderMock.createPreference.mockResolvedValue({ init_point: 'http://pix.link' });

      const result = await useCase.execute(dto);

      expect(paymentProviderMock.createPreference).toHaveBeenCalled();
      expect(result).toHaveProperty('checkoutUrl', 'http://pix.link');
      expect(mockTrx.commit).toHaveBeenCalled();
    });

    it('should finalize transaction locally without external provider for generic payment methods', async () => {
      const dto = {
        cpf: '76187209087',
        amount: 100,
        description: 'Test',
        paymentMethod: 'TRANSFER' as any
      };

      repositoryMock.register.mockResolvedValue({ id: '1', ...dto, status: PaymentStatus.PENDING });

      const result = await useCase.execute(dto);
      expect(paymentProviderMock.createPreference).not.toHaveBeenCalled();
      expect(mockTrx.commit).toHaveBeenCalled();
    });

    it('should validate mandatory input data and throw BadRequestException if paymentMethod is missing', async () => {
      const dto = { amount: 100 };
      await expect(useCase.execute(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should trigger rollback and propagate provider error when gateway returns an empty or malformed preference', async () => {
      const dto = {
        cpf: '76187209087',
        amount: 100,
        description: 'Test Invalid Response',
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      repositoryMock.register.mockResolvedValue({ id: '1', ...dto, status: PaymentStatus.PENDING });
      paymentProviderMock.createPreference.mockResolvedValue({});

      await expect(useCase.execute(dto)).rejects.toThrow(PaymentProviderException);
      expect(mockTrx.rollback).toHaveBeenCalled();
    });
  });
});

describe('MercadoPagoErrorMapper', () => {
  describe('Method: map()', () => {
    it('should return a generic fallback message when receiving an unmapped or unknown error code', () => {
      const result = MercadoPagoErrorMapper.map('UNKNOWN_CODE');
      expect(result).toBe('Erro inesperado no provedor de pagamento');
    });

    it('should correctly map client-side validation and authentication error codes to human-readable messages', () => {
      expect(MercadoPagoErrorMapper.map('400')).toContain('dados enviados são inválidos');
      expect(MercadoPagoErrorMapper.map('invalid_parameter')).toContain('dados enviados são inválidos');
      expect(MercadoPagoErrorMapper.map('401')).toContain('Erro de autenticação');
      expect(MercadoPagoErrorMapper.map('unauthorized')).toContain('Erro de autenticação');
    });

    it('should resolve critical provider failures and insufficient balance codes to specific user alerts', () => {
      expect(MercadoPagoErrorMapper.map('cc_rejected_insufficient_amount')).toContain('não possui saldo suficiente');
      expect(MercadoPagoErrorMapper.map('cc_rejected_call_for_authorize')).toContain('não foi autorizado');
      expect(MercadoPagoErrorMapper.map('500')).toContain('Erro interno');
      expect(MercadoPagoErrorMapper.map('internal_server_error')).toContain('Erro interno');
    });

    it('should provide clear instructions for card-related input errors like invalid number, date or CVV', () => {
      expect(MercadoPagoErrorMapper.map('cc_rejected_bad_filled_card_number')).toBe('Número do cartão inválido.');
      expect(MercadoPagoErrorMapper.map('cc_rejected_bad_filled_date')).toBe('Data de vencimento do cartão inválida.');
      expect(MercadoPagoErrorMapper.map('cc_rejected_bad_filled_security_code')).toBe('Código de segurança (CVV) inválido.');
    });
  });

  describe('Method: translate()', () => {
    it('should perform a direct translation for well-known static codes within the error dictionary', () => {
      expect(MercadoPagoErrorMapper.translate('cc_rejected_expired')).toBe('O cartão está expirado.');
      expect(MercadoPagoErrorMapper.translate('payment_method_not_found')).toBe('Método de pagamento não suportado.');
    });

    it('should return the default unexpected error message when code is not found in the translation record', () => {
      expect(MercadoPagoErrorMapper.translate('random_error')).toBe('Ocorreu um erro inesperado ao processar o pagamento.');
    });
  });
});