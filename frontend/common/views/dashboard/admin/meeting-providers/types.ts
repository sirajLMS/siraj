import type { GridColDef } from "@mui/x-data-grid";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { MeetingProvidersLabels } from "@/shared/locale";

export interface MeetingProvidersNotificationState {
  readonly errorOpen: boolean;
  readonly errorMsg: string;
  readonly successOpen: boolean;
  readonly successMsg: string;
  readonly showError: (message: string) => void;
  readonly showSuccess: (message: string) => void;
  readonly closeError: () => void;
  readonly closeSuccess: () => void;
}

export interface MeetingProvidersViewProps {
  readonly t: MeetingProvidersLabels;
  readonly locale: string;
  readonly rows: readonly MeetingProviderFieldsFragment[];
  readonly columns: GridColDef<MeetingProviderFieldsFragment>[];
  readonly loading: boolean;
  readonly createOpen: boolean;
  readonly editProvider: MeetingProviderFieldsFragment | null;
  readonly deleteProvider: MeetingProviderFieldsFragment | null;
  readonly deleting: boolean;
  readonly notifications: MeetingProvidersNotificationState;
  readonly onCreateOpen: () => void;
  readonly onCreateClose: () => void;
  readonly onCreateSaved: () => Promise<void>;
  readonly onEditRow: (row: MeetingProviderFieldsFragment) => void;
  readonly onEditClose: () => void;
  readonly onEditSaved: () => Promise<void>;
  readonly onDeleteRow: (row: MeetingProviderFieldsFragment) => void;
  readonly onDeleteClose: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
}
