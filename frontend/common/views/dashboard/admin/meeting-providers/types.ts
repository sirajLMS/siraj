import type { GridColDef } from "@mui/x-data-grid";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

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

export interface MeetingProvidersColumnLabels {
  readonly logo?: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly instructions?: string;
  readonly urlAllowlist?: string;
  readonly urlExample?: string;
  readonly capabilities?: string;
  readonly active: string;
  readonly inactive: string;
  readonly actions: string;
  readonly edit: string;
  readonly delete: string;
  readonly supportsUsername?: string;
  readonly supportsPassword?: string;
  readonly supportsTenantId?: string;
}

export interface MeetingProvidersViewLabels extends MeetingProvidersColumnLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly emptyCatalogTitle: string;
  readonly emptyCatalogBody: string;
  readonly addProvider: string;
  readonly createSuccess: string;
  readonly updateSuccess: string;
  readonly deleteSuccess: string;
  readonly deleteTitle: string;
  readonly deleteConfirm: string;
  readonly cancel: string;
  readonly operationFailed: string;
}

export interface MeetingProvidersViewProps {
  readonly t: MeetingProvidersViewLabels;
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
  readonly onCreateSaved: () => void;
  readonly onEditRow: (row: MeetingProviderFieldsFragment) => void;
  readonly onEditClose: () => void;
  readonly onEditSaved: () => void;
  readonly onDeleteRow: (row: MeetingProviderFieldsFragment) => void;
  readonly onDeleteClose: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
}
