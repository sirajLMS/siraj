import type { RelationsBuilderForSchema } from "@/backend/db/drizzleRelations.helpers";

const invoiceRelations = (r: RelationsBuilderForSchema) => ({
  invoices: {
    parent: r.one.parents({
      from: r.invoices.parentId,
      to: r.parents.id,
    }),
    student: r.one.students({
      from: r.invoices.studentId,
      to: r.students.id,
    }),
    createdBy: r.one.users({
      from: r.invoices.createdByUserId,
      to: r.users.id,
    }),
    coverageMonths: r.many.invoiceCoverageMonths({
      from: r.invoices.id,
      to: r.invoiceCoverageMonths.invoiceId,
    }),
    payments: r.many.payments({
      from: r.invoices.id,
      to: r.payments.invoiceId,
    }),
  },
  invoiceCoverageMonths: {
    invoice: r.one.invoices({
      from: r.invoiceCoverageMonths.invoiceId,
      to: r.invoices.id,
    }),
  },
  payments: {
    invoice: r.one.invoices({
      from: r.payments.invoiceId,
      to: r.invoices.id,
    }),
    userPaymentMethod: r.one.userPaymentMethods({
      from: r.payments.userPaymentMethodId,
      to: r.userPaymentMethods.id,
    }),
  },
});

const complaintRelations = (r: RelationsBuilderForSchema) => ({
  complaints: {
    parent: r.one.parents({
      from: r.complaints.parentId,
      to: r.parents.id,
    }),
    student: r.one.students({
      from: r.complaints.studentId,
      to: r.students.id,
    }),
    responses: r.many.complaintResponses({
      from: r.complaints.id,
      to: r.complaintResponses.complaintId,
    }),
  },
  complaintResponses: {
    complaint: r.one.complaints({
      from: r.complaintResponses.complaintId,
      to: r.complaints.id,
    }),
    responder: r.one.users({
      from: r.complaintResponses.responderUserId,
      to: r.users.id,
    }),
  },
  suggestions: {
    parent: r.one.parents({
      from: r.suggestions.parentId,
      to: r.parents.id,
    }),
    duplicateOf: r.one.suggestions({
      from: r.suggestions.duplicateOfId,
      to: r.suggestions.id,
    }),
    duplicates: r.many.suggestions({
      from: r.suggestions.id,
      to: r.suggestions.duplicateOfId,
    }),
    reviewedBy: r.one.users({
      from: r.suggestions.reviewedByUserId,
      to: r.users.id,
    }),
  },
});

const contentRelations = (r: RelationsBuilderForSchema) => ({
  learningResources: {
    uploadedBy: r.one.users({
      from: r.learningResources.uploadedByUserId,
      to: r.users.id,
    }),
  },
  systemSettings: {
    updatedBy: r.one.users({
      from: r.systemSettings.updatedByUserId,
      to: r.users.id,
    }),
  },
  siteContent: {
    updatedBy: r.one.users({
      from: r.siteContent.updatedByUserId,
      to: r.users.id,
    }),
  },
});

const teacherCompensationRelations = (r: RelationsBuilderForSchema) => ({
  teacherPayments: {
    teacher: r.one.teachers({
      from: r.teacherPayments.teacherId,
      to: r.teachers.id,
    }),
    userPaymentMethod: r.one.userPaymentMethods({
      from: r.teacherPayments.userPaymentMethodId,
      to: r.userPaymentMethods.id,
    }),
  },
  teacherDues: {
    teacher: r.one.teachers({
      from: r.teacherDues.teacherId,
      to: r.teachers.id,
    }),
    classInstance: r.one.classInstances({
      from: r.teacherDues.classInstanceId,
      to: r.classInstances.id,
    }),
    student: r.one.students({
      from: r.teacherDues.studentId,
      to: r.students.id,
    }),
    approvedBy: r.one.users({
      from: r.teacherDues.approvedByUserId,
      to: r.users.id,
    }),
    teacherPayment: r.one.teacherPayments({
      from: r.teacherDues.teacherPaymentId,
      to: r.teacherPayments.id,
    }),
  },
});

const auditRelations = (r: RelationsBuilderForSchema) => ({
  expenses: {
    teacher: r.one.teachers({
      from: r.expenses.teacherId,
      to: r.teachers.id,
    }),
    createdByUser: r.one.users({
      from: r.expenses.createdByUserId,
      to: r.users.id,
    }),
    deletedByUser: r.one.users({
      from: r.expenses.deletedByUserId,
      to: r.users.id,
    }),
  },
  adminAuditLogs: {
    actor: r.one.users({
      from: r.adminAuditLogs.actorUserId,
      to: r.users.id,
    }),
    target: r.one.users({
      from: r.adminAuditLogs.targetUserId,
      to: r.users.id,
    }),
  },
  currencyExchangeAuditLogs: {
    changedBy: r.one.users({
      from: r.currencyExchangeAuditLogs.changedByUserId,
      to: r.users.id,
    }),
  },
});

export const billingRelations = (r: RelationsBuilderForSchema) => ({
  ...invoiceRelations(r),
  ...complaintRelations(r),
  ...contentRelations(r),
  ...teacherCompensationRelations(r),
  ...auditRelations(r),
});
