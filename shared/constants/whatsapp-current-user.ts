/**
 * Sentinel value passed as `userId` in WhatsApp opt-in GraphQL queries/mutations
 * to indicate the currently authenticated user.
 *
 * The resolver interprets this value and substitutes `ctx.userId` from the
 * request context. This avoids leaking the real user ID to the client while
 * keeping the query semantically correct.
 *
 * @see {@link https://github.com/ahmed7354/siraj-whatsapp|Siraj WhatsApp} — opt-in flow
 */
export const CURRENT_USER = "me" as const;
