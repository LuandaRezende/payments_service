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
}