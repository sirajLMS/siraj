"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormSetValue,
  useForm,
  useWatch,
} from "react-hook-form";
import { AppPermission, CurrencyCode, InvoiceType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createManualInvoiceMutationDocument,
  parentAssociatedStudentsQueryDocument,
  parentDirectoryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useManualInvoiceUiStore } from "@/frontend/common/stores/manualInvoiceUiStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  type ManualInvoiceFormData,
  manualInvoiceSchema,
} from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ManualInvoiceLabels,
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import { buildManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import { formatDraftTotal } from "@/frontend/common/views/dashboard/billing/manual/utils/manualInvoiceFormatters";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

// NEW FOR PLAN v5 (manual-invoice wave): ViewModel now owns ALL state for the
// §6.1 + §6.2 contract — Server Component page renders the Container with no
// props (mirrors useAdminBillingViewModel). The Container renders the View
// which invokes this hook with `Record<string, never>` (per §6.2).
export type UseManualInvoiceViewModelProps = Record<string, never>;

// NEW FOR PLAN v5 (manual-invoice wave): Preserve the ManualInvoiceViewModel
// interface name so tier views keep their existing prop signature.
export interface ManualInvoiceViewModel {
  readonly labels: ManualInvoiceLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly draftCurrency: CurrencyCode;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly parentsLoading: boolean;
  readonly studentsLoading: boolean;
  readonly showSuccess: boolean;
  readonly onBack: () => void;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
  readonly onDismissSuccess: () => void;
}

function buildDefaultFormValues(): ManualInvoiceFormData {
  return {
    parentId: "",
    studentId: "",
    feeAmount: "",
    currency: CurrencyCode.Usd,
    issueDate: "",
    dueDate: "",
    billingMonths: [],
  };
}

function buildSubmitHandler(
  handleSubmit: UseFormHandleSubmit<ManualInvoiceFormData>,
  onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void,
  sendEmail: boolean
): () => void {
  return () => {
    handleSubmit(data => {
      onSubmit(data, sendEmail);
    })();
  };
}

function useResetStudentOnParentChange(
  currentParentId: string,
  setValue: UseFormSetValue<ManualInvoiceFormData>
): void {
  useEffect(() => {
    if (currentParentId) {
      setValue("studentId", "");
    }
  }, [currentParentId, setValue]);
}

function useAutoDismissOnSuccess(showSuccess: boolean, onDismissSuccess: () => void): void {
  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);
}

export function useManualInvoiceViewModel(_props: Readonly<UseManualInvoiceViewModelProps>): ManualInvoiceViewModel {
  const t = useAppTranslation().dashboardTranslations.billingManual;
  const labels = buildManualInvoiceLabels(t);
  const router = useRouter();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
  // NEW FOR PLAN v5: capability flag for the "submit & email" action. The
  // SYSTEM_DISPATCH_EMAIL permission gates ad-hoc email sends on the server;
  // we surface it so the tier view can disable the email variant when the
  // current actor is not authorized.
  const canSendEmail = hasPermission(AppPermission.SystemDispatchEmail);

  const selectedParentId = useManualInvoiceUiStore(state => state.selectedParentId);
  const setSelectedParentId = useManualInvoiceUiStore(state => state.setSelectedParentId);
  const isSubmitting = useManualInvoiceUiStore(state => state.isSubmitting);
  const setIsSubmitting = useManualInvoiceUiStore(state => state.setIsSubmitting);
  const showSuccess = useManualInvoiceUiStore(state => state.showSuccess);
  const setShowSuccess = useManualInvoiceUiStore(state => state.setShowSuccess);
  const dismissSuccess = useManualInvoiceUiStore(state => state.dismissSuccess);

  const { data: parentsData, loading: parentsLoading } = useQuery(parentDirectoryQueryDocument, {
    variables: { paginationArgs: null, search: null, lifecycleStatusFilter: null },
    fetchPolicy: "cache-and-network",
  });

  // CROSS-FILE DEPENDENCY: a dedicated `studentsForParentQueryDocument` keyed by
  // parentId does not currently exist. We reuse `parentAssociatedStudentsQueryDocument`
  // which accepts a non-null `parentId` (the parent's profile id, matching the
  // id column returned by `parentDirectoryQueryDocument` rows). When new
  // dedicated documents land, this block should be swapped.
  const { data: studentsData, loading: studentsLoading } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId: selectedParentId ?? "" },
    skip: !selectedParentId,
    fetchPolicy: "cache-and-network",
  });

  const parentOptions: readonly ParentInvoiceOption[] = parentsData?.parentDirectory?.rows
    ? parentsData.parentDirectory.rows
        .filter((row): row is NonNullable<typeof row> => row != null)
        .map(row => ({
          id: row.id ?? "",
          userId: row.userId ?? null,
          name: row.name ?? "",
          label: row.name ?? "",
        }))
    : [];

  const studentOptions: readonly StudentOption[] = studentsData?.parentAssociatedStudents
    ? studentsData.parentAssociatedStudents
        .filter((stu): stu is NonNullable<typeof stu> => stu != null)
        .map(stu => ({ id: stu.id ?? "", name: stu.name ?? "" }))
    : [];

  const schema = manualInvoiceSchema(labels.validation);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ManualInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultFormValues(),
  });

  const feeAmount = useWatch({ control, name: "feeAmount" });
  const billingMonths = useWatch({ control, name: "billingMonths" });
  const draftCurrency = useWatch({ control, name: "currency" }) ?? CurrencyCode.Usd;
  const currentParentId = useWatch({ control, name: "parentId" });
  const monthCount = billingMonths.length;
  const totalFormatted = formatDraftTotal(feeAmount, monthCount);

  const onParentChange = useCallback(
    (parentId: string | null) => {
      setSelectedParentId(parentId);
    },
    [setSelectedParentId]
  );

  useResetStudentOnParentChange(currentParentId ?? "", setValue);
  useAutoDismissOnSuccess(showSuccess, dismissSuccess);

  // Sync store's selectedParentId whenever the form's parentId changes — if the
  // user clears the autocomplete we have nothing to fetch students for.
  useEffect(() => {
    if ((currentParentId ?? "") !== selectedParentId) {
      onParentChange((currentParentId ?? "") || null);
    }
  }, [currentParentId, onParentChange, selectedParentId]);

  const [createManualInvoiceMutation] = useMutation(createManualInvoiceMutationDocument, {
    onCompleted: () => {
      setIsSubmitting(false);
      setShowSuccess(true);
    },
    onError: error => {
      setIsSubmitting(false);
      logger.error("Create manual invoice failed:", { error });
    },
  });

  const onSubmit = useCallback(
    (data: ManualInvoiceFormData, sendEmail: boolean) => {
      setIsSubmitting(true);
      createManualInvoiceMutation({
        variables: {
          parentId: data.parentId,
          studentId: data.studentId ?? null,
          amount: data.feeAmount,
          currency: data.currency,
          invoiceType: InvoiceType.Manual,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          exchangeRateSnapshot: null,
          exchangeRateSource: null,
          billingMonths: null,
          sendEmail,
        },
      }).catch(() => {});
    },
    [createManualInvoiceMutation, setIsSubmitting]
  );

  const onBack = useCallback(() => {
    router.push("/billing");
  }, [router]);

  const onSubmitClick = buildSubmitHandler(handleSubmit, onSubmit, false);
  const onSubmitAndSendEmailClick = buildSubmitHandler(handleSubmit, onSubmit, true);

  return {
    labels,
    parentOptions,
    studentOptions,
    control,
    errors,
    totalFormatted,
    draftCurrency,
    canCreate,
    canSendEmail,
    isSubmitting,
    parentsLoading,
    studentsLoading,
    showSuccess,
    onBack,
    onSubmitClick,
    onSubmitAndSendEmailClick,
    onDismissSuccess: dismissSuccess,
  };
}
