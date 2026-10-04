"use client";

import { useMemo, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";

export interface PersonFilterSelection {
  readonly option: PersonOption | null;
  readonly handleChange: (next: PersonOption | null) => void;
}

/**
 * Bridges the id-only store filter with the autocomplete's option shape: the
 * freshly picked option is kept in local state, and the report rows provide a
 * display fallback when the stored id no longer matches the local option
 * (initial mount, page navigation, or an external filter reset).
 */
export function usePersonFilterBridge<Row>(
  personId: string | null,
  rows: readonly Row[],
  idOf: (row: Row) => string | null,
  nameOf: (row: Row) => string | null,
  setPersonId: (personId: string | null) => void,
  findRowOption: (
    rows: readonly Row[],
    personId: string,
    idOf: (row: Row) => string | null,
    nameOf: (row: Row) => string | null
  ) => PersonOption | null
): PersonFilterSelection {
  const [picked, setPicked] = useState<PersonOption | null>(null);
  const option = useMemo<PersonOption | null>(() => {
    if (personId === null || personId === "") return null;
    if (picked?.id === personId) return picked;
    return findRowOption(rows, personId, idOf, nameOf);
  }, [rows, personId, picked, idOf, nameOf, findRowOption]);
  const handleChange = (next: PersonOption | null) => {
    setPicked(next);
    setPersonId(next?.id ?? null);
  };
  return { option, handleChange };
}
