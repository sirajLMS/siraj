// NEW FOR PLAN v5 (newly created for the migration wave): Pure-data icon
// resolver lifted out of both the mobile and desktop
// `studentProgressFeed.*.tsx` tier files per specs.md §3 N9 + §5 (lowercase
// pure-data helpers belong in `frontend/common/views/dashboard/<domain>/utils/`,
// not inlined in tier files). The two tier files previously declared
// byte-identical `function resolveFeedIcon(eventKind: TeacherProgressFeedEventKind): SvgIconComponent`
// helpers — both now import this single shared implementation.

import type { SvgIconComponent } from "@mui/icons-material";
import {
  CheckCircleOutlineOutlined,
  DescriptionOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
  PersonOffOutlined,
  PlayCircleOutlineOutlined,
  SensorsOutlined,
} from "@mui/icons-material";
import type { TeacherProgressFeedEventKind } from "@/frontend/common/types/shared.types";

// NEW FOR PLAN v5: resolveStudentProgressFeedIcon — pure-data icon resolver
// for the student-progress feed event-kind → Material icon mapping.
export function resolveStudentProgressFeedIcon(eventKind: TeacherProgressFeedEventKind): SvgIconComponent {
  switch (eventKind) {
    case "auto_missed":
      return EventBusyOutlined;
    case "marked_absent":
      return PersonOffOutlined;
    case "activated":
      return PlayCircleOutlineOutlined;
    case "started":
      return SensorsOutlined;
    case "completed":
      return CheckCircleOutlineOutlined;
    case "leave":
      return EventAvailableOutlined;
    default:
      return DescriptionOutlined;
  }
}
