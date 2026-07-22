// Shared props for the BookItemStatusBadge — the inline `Box component="span"`
// status pill previously duplicated between the desktop and mobile BookItemCard
// tier files. See `booksAndBags.types.ts` for the surrounding BookItemCard model.
export interface BookItemBadgeProps {
  /** Already-resolved localized label rendered inside the badge. */
  readonly statusLabel: string;
  /**
   * Token key under `theme.palette.status` — `${paletteKey}Container` and
   * `on${PaletteKey}Container` are derived from this value. Kept as a plain
   * string union to mirror the `BookItemCard` `statusPaletteKey` maps.
   */
  readonly paletteKey: "active" | "blocked" | "success" | "warning" | "error" | "info" | "neutral" | (string & {});
}
