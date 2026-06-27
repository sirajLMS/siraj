import type { useTranslations } from "next-intl";
import type {
  ComplaintsAdminLabels,
  ComplaintsLabels,
  ComplaintsParentLabels,
} from "@/shared/messages/types/dashboard/complaints/main";

type ComplaintsTranslator = ReturnType<typeof useTranslations<"dashboard.complaints">>;

function buildParentLabels(t: ComplaintsTranslator): ComplaintsParentLabels {
  return {
    pageTitle: t("parent.pageTitle"),
    formTitle: t("parent.formTitle"),
    student: t("parent.student"),
    category: t("parent.category"),
    contactEmail: t("parent.contactEmail"),
    contactEmailPlaceholder: t("parent.contactEmailPlaceholder"),
    complaintDetails: t("parent.complaintDetails"),
    complaintDetailsPlaceholder: t("parent.complaintDetailsPlaceholder"),
    submit: t("parent.submit"),
    successMessage: t("parent.successMessage"),
    policyTitle: t("parent.policyTitle"),
    policyBody: t("parent.policyBody"),
    recordTitle: t("parent.recordTitle"),
    totalRecords: t.raw("parent.totalRecords") as string,
    loadOlder: t("parent.loadOlder"),
    waitingMessage: t("parent.waitingMessage"),
    adminResponse: t("parent.adminResponse"),
    regarding: t("parent.regarding"),
    validation: {
      studentRequired: t("parent.validation.studentRequired"),
      emailRequired: t("parent.validation.emailRequired"),
      emailInvalid: t("parent.validation.emailInvalid"),
      detailsRequired: t("parent.validation.detailsRequired"),
      categoryRequired: t("parent.validation.categoryRequired"),
    },
    statusLabels: {
      pending: t("parent.statusLabels.pending"),
      resolved: t("parent.statusLabels.resolved"),
    },
    categoryLabels: {
      REGARDING_TEACHER: t("parent.categoryLabels.REGARDING_TEACHER"),
      REGARDING_SYSTEM: t("parent.categoryLabels.REGARDING_SYSTEM"),
      OTHER: t("parent.categoryLabels.OTHER"),
    },
  };
}

function buildAdminLabels(t: ComplaintsTranslator): ComplaintsAdminLabels {
  return {
    pageTitle: t("admin.pageTitle"),
    pageSubtitle: t("admin.pageSubtitle"),
    metrics: {
      unanswered: t("admin.metrics.unanswered"),
      answered: t("admin.metrics.answered"),
      avgResolution: t("admin.metrics.avgResolution"),
      efficiencyNote: t("admin.metrics.efficiencyNote"),
    },
    tabs: {
      unanswered: t("admin.tabs.unanswered"),
      answered: t("admin.tabs.answered"),
    },
    searchPlaceholder: t("admin.searchPlaceholder"),
    queue: {
      received: t("admin.queue.received"),
      yourResponse: t("admin.queue.yourResponse"),
      responsePlaceholder: t("admin.queue.responsePlaceholder"),
      answer: t("admin.queue.answer"),
      answerAndEmail: t("admin.queue.answerAndEmail"),
      adminResponse: t("admin.queue.adminResponse"),
      noEntries: t("admin.queue.noEntries"),
      deleteConfirmTitle: t("admin.queue.deleteConfirmTitle"),
      deleteConfirmBody: t("admin.queue.deleteConfirmBody"),
      deleteConfirmCancel: t("admin.queue.deleteConfirmCancel"),
      deleteConfirmConfirm: t("admin.queue.deleteConfirmConfirm"),
    },
    priorityLabels: {
      urgent: t("admin.priorityLabels.urgent"),
      general: t("admin.priorityLabels.general"),
    },
    categoryLabels: {
      REGARDING_TEACHER: t("admin.categoryLabels.REGARDING_TEACHER"),
      REGARDING_SYSTEM: t("admin.categoryLabels.REGARDING_SYSTEM"),
      OTHER: t("admin.categoryLabels.OTHER"),
    },
  };
}

export function buildComplaintsLabels(t: ComplaintsTranslator): ComplaintsLabels {
  return { parent: buildParentLabels(t), admin: buildAdminLabels(t) };
}
