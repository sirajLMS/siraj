/**
 * WhatsApp Groups enums (Meta WhatsApp Cloud API Groups).
 *
 * Backend-only enum registered in `backend/db/schema/enums.ts` (PG dialect)
 * and `backend/graphql/pothos/shared/enum.pothos.ts` (GraphQL exposure).
 */

/**
 * How a WhatsApp group admits new members: Meta-side admin approval must be
 * granted before a join request becomes membership, or requests are approved
 * automatically.
 */
export enum WhatsappGroupJoinApprovalMode {
  ApprovalRequired = "approval_required",
  AutoApprove = "auto_approve",
}
