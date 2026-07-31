import { describe } from "bun:test";

/** Skip the suite when required provider env vars are absent (FX / live-comm precedent). */
export function describeLiveWhen(enabled: boolean, _label: string) {
  return enabled ? describe : describe.skip;
}
