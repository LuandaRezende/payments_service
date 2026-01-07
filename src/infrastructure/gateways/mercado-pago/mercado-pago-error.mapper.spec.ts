import { MercadoPagoErrorMapper } from './mercado-pago-error.mapper';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('Unit Test: MercadoPagoErrorMapper', () => {

    describe('translate() method logic', () => {
        it('should correctly translate known gateway error codes into user-friendly messages', () => {
            const message = MercadoPagoErrorMapper.translate('cc_rejected_insufficient_amount');
            expect(message).toMatch(/Insufficient funds available on the card./i);
        });

        it('should return a fallback default message when an unknown error code is provided', () => {
            const message = MercadoPagoErrorMapper.translate('NON_EXISTENT_CODE');
            expect(message).toMatch(/An unexpected error occurred while processing the payment./i);
        });
    });

    describe('map() error code distribution', () => {
        it.each([
            ['400', /Invalid request parameters. Please verify payment details./i],
            ['invalid_parameter', /Invalid request parameters. Please verify payment details./i],
            ['401', /Authentication failure with the payment provider./i],
            ['unauthorized', /Authentication failure with the payment provider./i],
            ['cc_rejected_bad_filled_card_number', /Invalid credit card number format./i],
            ['cc_rejected_bad_filled_date', /Invalid card expiration date./i],
            ['cc_rejected_bad_filled_security_code', /Invalid security code CVV./i],
            ['cc_rejected_insufficient_amount', /Insufficient funds available on the card./i],
            ['cc_rejected_call_for_authorize', /Payment was declined by the issuing bank. Please contact them./i],
            ['500', /Internal server error at the payment gateway Mercado Pago./i],
            ['internal_server_error', /Internal server error at the payment gateway Mercado Pago./i],
            ['default_case', /An unexpected error occurred within the payment provider service./i],
        ])('should map gateway code "%s" to the expected localized regex pattern', (code, regex) => {
            expect(MercadoPagoErrorMapper.map(code)).toMatch(regex);
        });
    });

    describe('toDomainError() exception factory', () => {
        it('should transform HTTP 400 status into a BadRequestException', () => {
            const error = { response: { status: 400, data: { message: 'invalid_parameter' } } };
            const result = MercadoPagoErrorMapper.toDomainError(error);
            
            expect(result).toBeInstanceOf(BadRequestException);
        });

        it('should transform HTTP 401 unauthorized status into an InternalServerErrorException (Security Safety)', () => {
            const error = { response: { status: 401 } };
            const result = MercadoPagoErrorMapper.toDomainError(error);
            
            expect(result).toBeInstanceOf(InternalServerErrorException);
        });

        it('should preserve and propagate the original error message if it is explicitly provided', () => {
            const error = new Error('Custom Gateway Message');
            const result = MercadoPagoErrorMapper.toDomainError(error);
            
            expect(result.message).toBe('Custom Gateway Message');
        });

        it('should handle empty or null error objects using the global fallback mechanism (Boundary Case)', () => {
            const result = MercadoPagoErrorMapper.toDomainError({});
            
            expect(result).toBeInstanceOf(InternalServerErrorException);
            expect(result.message).toMatch(/An unexpected error occurred within the payment provider service./i);
        });
    });
});