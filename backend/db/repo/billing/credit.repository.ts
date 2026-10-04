import {
  aggregateBalanceFromLedgerImpl,
  countTransactionsImpl,
  findByClassInstanceIdImpl,
  findByIdempotencyKeysImpl,
  findSubtractCreditsByInstanceIdsImpl,
  getBalanceImpl,
  getHourBalanceImpl,
  getTransactionsImpl,
  listBySourcePaymentIdImpl,
} from "@/backend/db/repo/billing/credit.repository.queries";
import {
  createAdjustmentImpl,
  createHourAdjustmentImpl,
  createHourPurchaseImpl,
  createPurchaseImpl,
  deductForBookingImpl,
  deductHoursForBookingImpl,
  generateIdempotencyKeyImpl,
  insertBatchImpl,
  refundHoursOnCancelImpl,
  refundOnCancelImpl,
} from "@/backend/db/repo/billing/credit.repository.writes";

export namespace CreditRepository {
  export const getBalance = getBalanceImpl;
  export const getHourBalance = getHourBalanceImpl;
  export const getTransactions = getTransactionsImpl;
  export const listBySourcePaymentId = listBySourcePaymentIdImpl;
  export const countTransactions = countTransactionsImpl;
  export const createPurchase = createPurchaseImpl;
  export const deductForBooking = deductForBookingImpl;
  export const refundOnCancel = refundOnCancelImpl;
  export const createHourPurchase = createHourPurchaseImpl;
  export const deductHoursForBooking = deductHoursForBookingImpl;
  export const refundHoursOnCancel = refundHoursOnCancelImpl;
  export const createHourAdjustment = createHourAdjustmentImpl;
  export const createAdjustment = createAdjustmentImpl;
  export const findByIdempotencyKeys = findByIdempotencyKeysImpl;
  export const insertBatch = insertBatchImpl;
  export const findByClassInstanceId = findByClassInstanceIdImpl;
  export const aggregateBalanceFromLedger = aggregateBalanceFromLedgerImpl;
  export const generateIdempotencyKey = generateIdempotencyKeyImpl;
  export const findSubtractCreditsByInstanceIds = findSubtractCreditsByInstanceIdsImpl;
}
