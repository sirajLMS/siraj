/**
 * Default preset — aliases the baseline palette (Teal / Indigo, the original
 * Siraj brand). Per brand decision §13, each preset has its own directory
 * with `lightPalette.ts` + `darkPalette.ts`; the `default` preset simply
 * re-exports the baseline modules so the factory has a uniform shape.
 */

export { darkPalette } from "@/frontend/common/providers/theme/palette/darkPalette";
export { lightPalette } from "@/frontend/common/providers/theme/palette/lightPalette";
