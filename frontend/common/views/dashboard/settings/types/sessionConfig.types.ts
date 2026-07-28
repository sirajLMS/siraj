import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

export type SessionConfigRow = {
  readonly id: string;
  readonly roleName: string;
  readonly ttlSeconds: number;
  readonly maxConcurrentSessions: number;
};

export interface SessionConfigTabViewModel {
  readonly rows: readonly SessionConfigRow[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly labels: SettingsSessionTabLabels;
  readonly formOpen: boolean;
  readonly editRow: SessionConfigRow | null;
  readonly deleteRow: SessionConfigRow | null;
  readonly isDeleting: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (row: SessionConfigRow) => void;
  readonly onDelete: (row: SessionConfigRow) => void;
  readonly onFormClose: () => void;
  readonly onDeleteClose: () => void;
  readonly onSaved: () => Promise<void>;
  readonly onConfirmDelete: () => Promise<void>;
}

export type UseSessionConfigTabViewModelProps = Record<string, never>;
