import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export type SiteContentRow = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly body: string;
  readonly contentType: string;
  readonly isPublished: boolean;
};

export interface SiteContentSettingsViewModel {
  readonly rows: readonly SiteContentRow[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly labels: SettingsSiteContentTabLabels;
  readonly formOpen: boolean;
  readonly editRow: SiteContentRow | null;
  readonly deleteRow: SiteContentRow | null;
  readonly isDeleting: boolean;
  readonly togglingPublishId: string | null;
  readonly onAdd: () => void;
  readonly onEdit: (row: SiteContentRow) => void;
  readonly onDelete: (row: SiteContentRow) => void;
  readonly onFormClose: () => void;
  readonly onDeleteClose: () => void;
  readonly onSaved: () => Promise<void>;
  readonly onConfirmDelete: () => Promise<void>;
  readonly onTogglePublish: (row: SiteContentRow, isPublished: boolean) => Promise<void>;
}

export type UseSiteContentSettingsViewModelProps = Record<string, never>;
