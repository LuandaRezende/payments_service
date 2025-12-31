import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentProviderException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ message, providerError: true }, statusCode);
  }
}