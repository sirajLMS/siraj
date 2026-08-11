/**
 * Backend enum shim for class instance detail enums.
 *
 * The canonical enum definitions (ClassType, ClassOutcome, ClassExecutionState)
 * live in `@/shared/constants/class-instance-detail.enum` because both the
 * frontend and backend need the same string values. This file re-exports them
 * so that the Pothos GraphQL layer can import the enums from `@/backend/enum`
 * (the standard Pothos enum registration entry point) while keeping a single
 * source of truth in the shared layer.
 *
 * @deprecated This is a re-export shim. The canonical definitions live in
 * `@/shared/constants/class-instance-detail.enum`. Backend code should import
 * from this module to maintain import-source consistency.
 */
export { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
