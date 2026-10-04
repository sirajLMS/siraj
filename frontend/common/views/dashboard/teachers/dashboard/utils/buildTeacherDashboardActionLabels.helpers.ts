import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import type { TeacherDashboardLabels as TeacherDashboardTranslator } from "@/shared/locale";

export function buildActionLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["actions"] {
  return {
    activate: t.actions.activate,
    activateSession: t.actions.activateSession,
    connecting: t.actions.connecting,
    printSchedule: t.actions.printSchedule,
    manualEntry: t.actions.manualEntry,
    newSession: t.actions.newSession,
    joinVideo: t.actions.joinVideo,
    downloadHandbook: t.actions.downloadHandbook,
    contactCoordinator: t.actions.contactCoordinator,
    disabledTooltips: {
      activateBeforeWindow: t.actions.disabledTooltips.activateBeforeWindow,
      activateAfterWindow: t.actions.disabledTooltips.activateAfterWindow,
      activateConnecting: t.actions.disabledTooltips.activateConnecting,
      joinVideoUnavailable: t.actions.disabledTooltips.joinVideoUnavailable,
      markAbsentWaitingPeriod: t.actions.disabledTooltips.markAbsentWaitingPeriod,
    },
  };
}

export function buildActiveControlsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeControls"] {
  return {
    liveNow: t.activeControls.liveNow,
    sessionControls: t.activeControls.sessionControls,
    startSession: t.activeControls.startSession,
    markAbsent: t.activeControls.markAbsent,
    requestLeave: t.activeControls.requestLeave,
    markAbsentDialogTitle: t.activeControls.markAbsentDialogTitle,
    markAbsentConfirmation: t.activeControls.markAbsentConfirmation,
    markAbsentConfirm: t.activeControls.markAbsentConfirm,
    cancel: t.activeControls.cancel,
  };
}

export function buildManualClassEntryLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["manualClassEntry"] {
  return {
    titleCreate: t.manualClassEntry.titleCreate,
    titleCreateActive: t.manualClassEntry.titleCreateActive,
    cancel: t.manualClassEntry.cancel,
    create: t.manualClassEntry.create,
    creating: t.manualClassEntry.creating,
    studentLabel: t.manualClassEntry.studentLabel,
    studentLoading: t.manualClassEntry.studentLoading,
    noStudentsAssigned: t.manualClassEntry.noStudentsAssigned,
    subjectLabel: t.manualClassEntry.subjectLabel,
    subjectPlaceholder: t.manualClassEntry.subjectPlaceholder,
    scheduledDate: t.manualClassEntry.scheduledDate,
    startTime: t.manualClassEntry.startTime,
    durationMinutes: t.manualClassEntry.durationMinutes,
    classType: t.manualClassEntry.classType,
    classTypeRegular: t.manualClassEntry.classTypeRegular,
    classTypeTrial: t.manualClassEntry.classTypeTrial,
    classTypePromotion: t.manualClassEntry.classTypePromotion,
    selectStudent: t.manualClassEntry.selectStudent,
    selectSubject: t.manualClassEntry.selectSubject,
    selectDate: t.manualClassEntry.selectDate,
    selectTime: t.manualClassEntry.selectTime,
    createFailed: t.manualClassEntry.createFailed,
    teacherIdNotFound: t.manualClassEntry.teacherIdNotFound,
  };
}
