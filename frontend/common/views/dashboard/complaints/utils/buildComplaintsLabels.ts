import type {
  ComplaintsAdminLabels,
  ComplaintsLabels,
  ComplaintsParentLabels,
} from "@/shared/locale/types/dashboard/complaints";

function buildParentLabels(t: ComplaintsParentLabels): ComplaintsParentLabels {
  return {
    pageTitle: t.pageTitle,
    formTitle: t.formTitle,
    student: t.student,
    category: t.category,
    contactEmail: t.contactEmail,
    contactEmailPlaceholder: t.contactEmailPlaceholder,
    complaintDetails: t.complaintDetails,
    complaintDetailsPlaceholder: t.complaintDetailsPlaceholder,
    submit: t.submit,
    successMessage: t.successMessage,
    policyTitle: t.policyTitle,
    policyBody: t.policyBody,
    recordTitle: t.recordTitle,
    totalRecords: t.totalRecords,
    loadOlder: t.loadOlder,
    waitingMessage: t.waitingMessage,
    adminResponse: t.adminResponse,
    regarding: t.regarding,
    validation: {
      studentRequired: t.validation.studentRequired,
      emailRequired: t.validation.emailRequired,
      emailInvalid: t.validation.emailInvalid,
      detailsRequired: t.validation.detailsRequired,
      categoryRequired: t.validation.categoryRequired,
    },
    statusLabels: {
      pending: t.statusLabels.pending,
      resolved: t.statusLabels.resolved,
    },
    categoryLabels: {
      REGARDING_TEACHER: t.categoryLabels.REGARDING_TEACHER,
      REGARDING_SYSTEM: t.categoryLabels.REGARDING_SYSTEM,
      OTHER: t.categoryLabels.OTHER,
    },
  };
}

function buildAdminLabels(t: ComplaintsAdminLabels): ComplaintsAdminLabels {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    metrics: {
      unanswered: t.metrics.unanswered,
      answered: t.metrics.answered,
      avgResolution: t.metrics.avgResolution,
      efficiencyNote: t.metrics.efficiencyNote,
    },
    tabs: {
      unanswered: t.tabs.unanswered,
      answered: t.tabs.answered,
    },
    searchPlaceholder: t.searchPlaceholder,
    queue: {
      received: t.queue.received,
      yourResponse: t.queue.yourResponse,
      responsePlaceholder: t.queue.responsePlaceholder,
      answer: t.queue.answer,
      answerAndEmail: t.queue.answerAndEmail,
      adminResponse: t.queue.adminResponse,
      noEntries: t.queue.noEntries,
      deleteConfirmTitle: t.queue.deleteConfirmTitle,
      deleteConfirmBody: t.queue.deleteConfirmBody,
      deleteConfirmCancel: t.queue.deleteConfirmCancel,
      deleteConfirmConfirm: t.queue.deleteConfirmConfirm,
    },
    priorityLabels: {
      urgent: t.priorityLabels.urgent,
      general: t.priorityLabels.general,
    },
    categoryLabels: {
      REGARDING_TEACHER: t.categoryLabels.REGARDING_TEACHER,
      REGARDING_SYSTEM: t.categoryLabels.REGARDING_SYSTEM,
      OTHER: t.categoryLabels.OTHER,
    },
  };
}

export function buildComplaintsLabels(t: ComplaintsLabels): ComplaintsLabels {
  return { parent: buildParentLabels(t.parent), admin: buildAdminLabels(t.admin) };
}
