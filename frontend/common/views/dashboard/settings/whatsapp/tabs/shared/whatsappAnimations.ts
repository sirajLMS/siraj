/**
 * Shared animation constants and keyframe sx helpers for the WhatsApp settings UI.
 *
 * Used by both desktop and mobile NumbersTab variants to avoid duplication.
 * Uses `@keyframes` embedded in `sx` objects (MUI v9 pattern) rather than
 * importing `keyframes` from `@mui/material/styles` — keeping the keyframes
 * co-located with the component sx that references them.
 */

// ── Duration constants (ms) ──

const TAB_FADE_DURATION = 200;
export const ROW_ENTER_DURATION = 300;
export const ROW_DELETE_DURATION = 300;
const SYNC_PULSE_DURATION = 1000;

// ── Tab fade-in keyframe sx (opacity + translateY, ease-in-out) ──

export const tabFadeInSx = {
  "@keyframes whatsappTabFadeIn": {
    "0%": { opacity: 0, transform: "translateY(4px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  animation: `whatsappTabFadeIn ${TAB_FADE_DURATION}ms ease-in-out`,
} as const;

// ── Sync pulse keyframe sx (1s infinite opacity pulse) ──

export const syncPulseSx = {
  "@keyframes whatsappSyncPulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.5 },
  },
  animation: `whatsappSyncPulse ${SYNC_PULSE_DURATION}ms ease-in-out infinite`,
} as const;
