import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentPortalProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile";

export type StudentProfileSectionLabels = StudentPortalProfileLabels;

type StudentProfileDraftPatch = (patch: Partial<StudentPortalProfileEditDraft>) => void;

export type StudentProfileSectionBaseProps = {
  readonly profile: StudentProfileRow;
  readonly labels: StudentProfileSectionLabels;
  readonly sectionTitle: string;
  readonly notSetLabel: string;
  readonly timezoneLabel: string;
  readonly enforceFieldAccess?: boolean;
};

export type StudentProfileEditableSectionProps = StudentProfileSectionBaseProps & {
  readonly isEditing: boolean;
  readonly draft: StudentPortalProfileEditDraft;
  readonly onDraftChange: StudentProfileDraftPatch;
};
