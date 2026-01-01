export class MercadoPagoErrorMapper {
  private static readonly errors: Record<string, string> = {
    'cc_rejected_insufficient_amount': 'O cartão possui saldo insuficiente.',
    'cc_rejected_bad_filled_number': 'O número do cartão está incorreto.',
    'cc_rejected_bad_filled_security_code': 'O código de segurança (CVV) é inválido.',
    'cc_rejected_expired': 'O cartão está expirado.',
    'cc_rejected_call_for_authorize': 'O pagamento não foi autorizado pelo banco emissor.',
    'payment_method_not_found': 'Método de pagamento não suportado.',
  };

  static translate(code: string): string {
    return this.errors[code] || 'Ocorreu um erro inesperado ao processar o pagamento.';
  }

  static map(errorCode: string): string {
    switch (errorCode) {
      case '400':
      case 'invalid_parameter':
        return 'Os dados enviados são inválidos. Verifique as informações do pagamento.';

      case '401':
      case 'unauthorized':
        return 'Erro de autenticação com o provedor de pagamento.';

      case 'cc_rejected_bad_filled_card_number':
        return 'Número do cartão inválido.';

      case 'cc_rejected_bad_filled_date':
        return 'Data de vencimento do cartão inválida.';

      case 'cc_rejected_bad_filled_security_code':
        return 'Código de segurança (CVV) inválido.';

      case 'cc_rejected_insufficient_amount':
        return 'O cartão não possui saldo suficiente.';

      case 'cc_rejected_call_for_authorize':
        return 'O pagamento não foi autorizado. Entre em contato com seu banco.';

      case '500':
      case 'internal_server_error':
        return 'Erro interno no servidor do Mercado Pago.';

      default:
        return 'Erro inesperado no provedor de pagamento';
    }
  }
}