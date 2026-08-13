import {
  CheckCircleOutlineOutlined,
  DescriptionOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
  PersonOffOutlined,
  PlayCircleOutlineOutlined,
  SensorsOutlined,
  type SvgIconComponent,
} from "@mui/icons-material";
import { TeacherProgressFeedEventKind } from "@/frontend/common/graphql/generated/gql/graphql-types";

// NEW FOR PLAN v5: resolveStudentProgressFeedIcon — pure-data icon resolver
// for the student-progress feed event-kind → Material icon mapping.
export function resolveStudentProgressFeedIcon(eventKind: TeacherProgressFeedEventKind): SvgIconComponent {
  switch (eventKind) {
    case TeacherProgressFeedEventKind.AutoMissed:
      return EventBusyOutlined;
    case TeacherProgressFeedEventKind.MarkedAbsent:
      return PersonOffOutlined;
    case TeacherProgressFeedEventKind.Activated:
      return PlayCircleOutlineOutlined;
    case TeacherProgressFeedEventKind.Started:
      return SensorsOutlined;
    case TeacherProgressFeedEventKind.Completed:
      return CheckCircleOutlineOutlined;
    case TeacherProgressFeedEventKind.Leave:
      return EventAvailableOutlined;
    default:
      return DescriptionOutlined;
  }
}
