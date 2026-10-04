/** Terminal domain rejections the dialog maps onto inline field errors. */
export const TEACHER_IMMUTABLE_ERROR_CODE = "CARRYOVER_TEACHER_IMMUTABLE";

/** Root field holding the carryover list page; dropped from the cache after writes. */
export const CARRYOVER_LIST_FIELD = "carryoverBalances";

/** Server-side cap on the persisted operator note, mirrored so typing stops at the limit. */
export const CARRYOVER_NOTE_MAX_LENGTH = 2000;
