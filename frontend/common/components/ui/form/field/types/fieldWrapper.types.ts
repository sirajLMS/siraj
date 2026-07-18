import type { ReactNode } from "react";

// NEW FOR PLAN v5: unified FieldWrapperProps lifted from Mobile/Desktop twins (byte-identical).
export interface FieldWrapperProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}
