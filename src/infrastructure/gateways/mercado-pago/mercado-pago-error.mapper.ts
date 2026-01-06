import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

export class MercadoPagoErrorMapper {
  private static readonly errors: Record<string, string> = {
    'cc_rejected_insufficient_amount': 'Insufficient funds available on the card.',
    'cc_rejected_bad_filled_number': 'Incorrect card number provided.',
    'cc_rejected_bad_filled_security_code': 'Invalid security code CVV.',
    'cc_rejected_expired': 'The provided card has expired.',
    'cc_rejected_call_for_authorize': 'Payment was declined by the issuing bank. Please contact them.',
    'payment_method_not_found': 'The selected payment method is not supported.',
    'cc_rejected_bad_filled_card_number': 'Invalid credit card number format.',
    'cc_rejected_bad_filled_date': 'Invalid card expiration date.',
    'invalid_parameter': 'Invalid request parameters. Please verify payment details.',
    'unauthorized': 'Authentication failure with the payment provider.',
    'internal_server_error': 'Internal server error at the payment gateway Mercado Pago.',
  };

  static translate(code: string): string {
    return this.errors[code] || 'An unexpected error occurred while processing the payment.';
  }

  static map(errorCode: string): string {
    if (this.errors[errorCode]) {
      return this.errors[errorCode];
    }

    switch (errorCode) {
      case '400':
        return this.errors['invalid_parameter'];

      case '401':
        return this.errors['unauthorized'];

      case '500':
        return this.errors['internal_server_error'];

      default:
        return 'An unexpected error occurred within the payment provider service.';
    }
  }

  static toDomainError(error: unknown): Error {
    const err = error as { 
      response?: { status?: number; data?: { message?: string } }; 
      code?: string;
      message?: string;
    };

    const errorCode =
      err?.response?.data?.message ||
      err?.response?.status?.toString() ||
      err?.code ||
      'default';

    const message = this.map(errorCode);
    const status = err?.response?.status;

    if (status === 400) {
      return new BadRequestException(message);
    }

    if (status === 401) {
      return new InternalServerErrorException('Authentication failure with the payment gateway.');
    }

    return new InternalServerErrorException(err?.message || message);
  }
}