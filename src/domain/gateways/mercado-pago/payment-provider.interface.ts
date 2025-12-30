export interface PaymentProvider {
  createPreference(payment: any): Promise<{ init_point: string; external_reference: string }>;
  getPaymentDetails(externalId: string): Promise<{ status: string; external_reference: string }>;
}