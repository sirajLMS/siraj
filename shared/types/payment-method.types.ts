/**
 * Canonical cross-layer shape for the payment-method details field keys.
 *
 * The backend binds this as the public (GraphQL) projection of the JSONB
 * `PaymentMethodDetails` union — sensitive identifier fields (iban,
 * accountNumber, routingNumber, phone, url, identifier) reach that boundary
 * only in masked form. The frontend reuses the same canonical keys as the
 * form-value shape for payment-method input fields. Field keys must never be
 * duplicated across layers; both sides alias this single definition.
 */
export type PaymentMethodDetailsShape = {
  readonly walletId?: string;
  readonly phone?: string;
  readonly paymentLinkId?: string;
  readonly url?: string;
  readonly onlineAccountId?: string;
  readonly identifier?: string;
  readonly iban?: string;
  readonly bankName?: string;
  readonly beneficiaryName?: string;
  readonly swiftBic?: string;
  readonly accountNumber?: string;
  readonly routingNumber?: string;
  readonly note?: string;
};
