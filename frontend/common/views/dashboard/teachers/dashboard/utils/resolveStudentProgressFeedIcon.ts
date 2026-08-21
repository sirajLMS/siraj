import {
  CheckCircleOutlined,
  DescriptionOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
  PersonOffOutlined,
  PlayCircleOutlined,
  SensorsOutlined,
  type SvgIconComponent,
} from "@mui/icons-material";
import { TeacherProgressFeedEventKind } from "@/frontend/common/graphql/generated/gql/graphql";

// NEW FOR PLAN v5: resolveStudentProgressFeedIcon — pure-data icon resolver
// for the student-progress feed event-kind → Material icon mapping.
export function resolveStudentProgressFeedIcon(eventKind: TeacherProgressFeedEventKind): SvgIconComponent {
  switch (eventKind) {
    case TeacherProgressFeedEventKind.AutoMissed:
      return EventBusyOutlined;
    case TeacherProgressFeedEventKind.MarkedAbsent:
      return PersonOffOutlined;
    case TeacherProgressFeedEventKind.Activated:
      return PlayCircleOutlined;
    case TeacherProgressFeedEventKind.Started:
      return SensorsOutlined;
    case TeacherProgressFeedEventKind.Completed:
      return CheckCircleOutlined;
    case TeacherProgressFeedEventKind.Leave:
      return EventAvailableOutlined;
    default:
      return DescriptionOutlined;
  }
}
