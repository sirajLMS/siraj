# Design: Certificate Generation & Verification UI (Plan 08)

## Document Information

- **Feature Name**: Certificate Generation & Verification Frontend UI
- **Target Directory**: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui/requirements.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/05-frontend-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/08-app-router-navigation.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/06-i18n-system.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/04-template-ui.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/06-student-recipient.md`

---

## 1. Architecture Overview

### 1.1 Three-Location Frontend Split

Siraj's frontend follows a strict three-location split pattern. This plan adds certificate-specific files to each location:

```
Location 1 — App Router (Server Components):
─────────────────────────────────────────────
app/(dashboard)/
├── dashboard/certificates/page.tsx          ← List page (auth + permission guard)
├── dashboard/certificates/[id]/page.tsx     ← Detail page (auth + permission guard)

app/
└── [locale]/verify/[code]/page.tsx          ← PUBLIC verification page (no auth)

Location 2 — Tier-Neutral Containers + ViewModels:
─────────────────────────────────────────────
frontend/common/views/dashboard/certificates/
├── CertificateListContainer.tsx             ← Container (wraps ViewModel in RequirePermission + ResponsiveViewSwitch)
├── CertificateDetailContainer.tsx           ← Detail container
├── GenerateCertificateDialog.tsx            ← Generation dialog (client component)
├── RevokeCertificateDialog.tsx               ← Revocation dialog (client component)
├── useCertificateListViewModel.ts           ← List ViewModel hook (Apollo + Zustand + router + permissions)
├── useCertificateDetailViewModel.ts         ← Detail ViewModel hook
├── types.ts                                 ← View-local types (CertificateRow, CertificateDetailData, etc.)
└── schemas.ts                               ← Form schemas (revocation reason validation)

frontend/common/views/public/verify/
└── CertificateVerifyPage.tsx                ← Shared public verification page (client component, receives server props)

Location 3 — Tier-Specific Presentation:
─────────────────────────────────────────────
frontend/desktop/views/dashboard/certificates/
├── certificateListView.desktop.tsx          ← Desktop list (DesktopAppDataGrid)
└── certificateDetailView.desktop.tsx         ← Desktop detail (split layout)

frontend/mobile/views/dashboard/certificates/
├── certificateListView.mobile.tsx            ← Mobile list (card-based)
└── certificateDetailView.mobile.tsx         ← Mobile detail (stacked)

Shared Infrastructure:
─────────────────────────────────────────────
frontend/common/graphql/sharedDocuments/cert/
└── certificates.documents.ts                 ← GraphQL documents (TypedDocumentNode)

frontend/common/stores/
└── certificatesStore.ts                      ← Zustand store (filters, pagination, search)
```

### 1.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Certificate List Data Flow                        │
│                                                                         │
│  app/(dashboard)/dashboard/certificates/page.tsx                         │
│    │ getServerUserContext() → requirePermissionForPage()                │
│    ↓                                                                     │
│  CertificateListContainer (client)                                       │
│    │ useCertificateListViewModel()                                       │
│    │   ├─ useQuery(CertificatesQueryDocument) ← Apollo                   │
│    │   ├─ useZustand(certificatesStore) ← filters/page/search            │
│    │   ├─ useUserStore() ← permissions (canGenerate, canRevoke, etc.)   │
│    │   ├─ useRouter() ← navigate to detail                               │
│    │   ├─ useAppTranslation(Translation.Dashboard.Certificates)          │
│    │   ↓                                                                 │
│    └─ ResponsiveViewSwitch                                               │
│         ├─ CertificateListDesktop (AppDataGrid)                          │
│         └─ CertificateListMobile (Card list)                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     Certificate Detail Data Flow                         │
│                                                                         │
│  app/(dashboard)/dashboard/certificates/[id]/page.tsx                   │
│    │ getServerUserContext() → requirePermissionForPage()                │
│    │ params.id                                                           │
│    ↓                                                                     │
│  CertificateDetailContainer (client)                                     │
│    │ useCertificateDetailViewModel({ certificateId })                     │
│    │   ├─ useQuery(CertificateQueryDocument) ← Apollo                    │
│    │   ├─ useUserStore() ← canRevoke, canDownload                        │
│    │   ├─ useRouter() ← back to list                                     │
│    │   ├─ useAppTranslation(Translation.Dashboard.Certificates)          │
│    │   ↓                                                                 │
│    └─ ResponsiveViewSwitch                                               │
│         ├─ CertificateDetailDesktop (split: info + PDF iframe)           │
│         └─ CertificateDetailMobile (stacked: info + thumbnail)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Public Verification Data Flow                         │
│                                                                         │
│  app/[locale]/verify/[code]/page.tsx                                     │
│    │ getLocale() (from params)                                           │
│    │ getTranslations(locale) ← synchronous                               │
│    │ CertificateManagementService.getByVerificationCode(code)            │
│    │   ↑ DIRECT service call (Server Component, NO GraphQL)              │
│    ↓                                                                     │
│  CertificateVerifyPage (client)                                          │
│    │ receives { certificate, labels } as props                           │
│    │ renders status badge, recipient, issue date, academy, QR code      │
│    │ NO hooks except ephemeral UI state (copy verification code)         │
│    ↓                                                                     │
│  Standalone page (no sidebar, no dashboard layout)                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Public route has `[locale]` segment | Shared verification links go to users who may not have a locale cookie. The URL must encode the locale for correct SSR. Dashboard routes use cookie-based locale (no `[locale]`) since those are always same-user sessions. |
| Public route calls service directly | Siraj's architecture: Server Components call services directly (not GraphQL). The public verification page is a Server Component — calling `CertificateManagementService` is the Siraj pattern. |
| No `[locale]` for dashboard cert routes | Siraj uses cookie-based locale (`getLocale()` from `@/shared/locale/server-cookies`) for all `(dashboard)` routes. Routes are `/dashboard/certificates`, not `/[locale]/dashboard/certificates`. |
| Multi-step generation dialog uses local state | The generation dialog's form state (selected template, selected recipient group, step index) is ephemeral and lives in `useState`. Zustand is for persistent list filters only. |
| `fetchPolicy: "cache-and-network"` | Ensures the list shows cached data immediately then updates with fresh server data. Standard Siraj Apollo query policy. |
| QR code library: `qrcode.react` | Lightweight (~15KB), React-native, works with MUI. Used to render the verification URL as a scannable QR code. |

---

## 2. App Router Pages (Server Components)

### 2.1 List Page — `app/(dashboard)/dashboard/certificates/page.tsx`

```tsx
import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { CertificateListContainer } from "@/frontend/common/views/dashboard/certificates/CertificateListContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.certificates.list;
  return { title: t.pageTitle };
}

export default async function CertificateListPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  await requirePermissionForPage(
    userId,
    [
      AppPermission.CertificatesList,
      AppPermission.CertificatesViewOwn,
      AppPermission.CertificatesViewOther,
    ],
    locale,
    context
  );

  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <CertificateListContainer />
    </Suspense>
  );
}
```

**Permission semantics:** OR — any one of `CERTIFICATES_LIST`, `CERTIFICATES_VIEW_OWN`, or `CERTIFICATES_VIEW_OTHER` grants access. The server-side list query scopes results based on the authenticated user's actual permissions.

### 2.2 Detail Page — `app/(dashboard)/dashboard/certificates/[id]/page.tsx`

```tsx
import { Box, CircularProgress } from "@mui/material";
import type { Metadata } from "next";
import { Suspense from "react";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { CertificateDetailContainer } from "@/frontend/common/views/dashboard/certificates/CertificateDetailContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface CertificateDetailPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.certificates.detail;
  return { title: t.pageTitle };
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  await requirePermissionForPage(
    userId,
    [AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther],
    locale,
    context
  );

  const { id } = await params;

  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <CertificateDetailContainer certificateId={id} />
    </Suspense>
  );
}
```

### 2.3 Public Verification Page — `app/[locale]/verify/[code]/page.tsx`

```tsx
import type { Metadata } from "next";
import { CertificateManagementService } from "@/backend/services/certificates";
import { CertificateVerifyPage } from "@/frontend/common/views/public/verify/CertificateVerifyPage";
import { getTranslations } from "@/shared/locale";
import type { AppLocale } from "@/shared/locale/AppLocale";

interface VerifyPageProps {
  readonly params: Promise<{ readonly locale: AppLocale; readonly code: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.certificates.verify;
  return { title: t.pageTitle };
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { locale, code } = await params;
  const t = getTranslations(locale).dashboardTranslations.certificates.verify;

  // Server Component calls service DIRECTLY — no GraphQL, no auth
  const certificate = await CertificateManagementService.getByVerificationCode(code);

  // Pass translated labels as props (server → client boundary)
  const labels = {
    pageTitle: t.pageTitle,
    valid: t.valid,
    expired: t.expired,
    revoked: t.revoked,
    notFound: t.notFound,
    recipientName: t.recipientName,
    issueDate: t.issueDate,
    templateName: t.templateName,
    academyName: t.academyName,
    verificationCode: t.verificationCode,
    statusLabel: t.statusLabel,
    revocationReason: t.revocationReason,
    verifyAnother: t.verifyAnother,
    scanQrCode: t.scanQrCode,
  };

  return <CertificateVerifyPage certificate={certificate} labels={labels} />;
}
```

**Key differences from dashboard pages:**
1. Uses `[locale]` segment in the URL — not cookie-based (`getLocale()`) — because verification links are shared externally
2. NO `getServerUserContext()` — public route, no auth
3. NO `requirePermissionForPage()` — no permission check
4. Calls service directly: `CertificateManagementService.getByVerificationCode(code)` — NOT GraphQL
5. Uses `getTranslations(locale)` (synchronous — returns property chain, not a promise)
6. Passes translated `labels` object as props to the client component

### 2.4 Public Verification Layout — `app/[locale]/verify/[code]/layout.tsx`

A minimal layout (not the dashboard layout) that provides only basic HTML chrome — no sidebar, no dashboard navigation:

```tsx
import { Box } from "@mui/material";
import { AppThemeProvider } from "@/frontend/common/components/theme/AppThemeProvider";

export default function VerifyLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 3 }}>
        {children}
      </Box>
    </AppThemeProvider>
  );
}
```

---

## 3. Tier-Neutral Containers (frontend/common/views/dashboard/certificates/)

### 3.1 CertificateListContainer.tsx

```tsx
"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type CertificateListViewModel,
  type UseCertificateListViewModelProps,
  useCertificateListViewModel,
} from "@/frontend/common/views/dashboard/certificates/useCertificateListViewModel";

const lazyViews = createLazyView<CertificateListViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/certificates/certificateListView.mobile").then(m => ({
      default: m.CertificateListMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/certificates/certificateListView.desktop").then(m => ({
      default: m.CertificateListDesktop,
    }))
);

export function CertificateListContainer(props: UseCertificateListViewModelProps) {
  const viewModel = useCertificateListViewModel(props);

  return (
    <RequirePermission
      permissions={[
        AppPermission.CertificatesList,
        AppPermission.CertificatesViewOwn,
        AppPermission.CertificatesViewOther,
      ]}
      fallback={null}
    >
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { CertificateListViewModel, UseCertificateListViewModelProps };
```

### 3.2 useCertificateListViewModel.ts

```tsx
"use client";

import { useQuery } from "@apollo/client/react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  certificatesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/cert/certificates.documents";
import { useCertificatesStore } from "@/frontend/common/stores/certificatesStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  CertificateListRow,
  CertificateStatusFilter,
} from "@/frontend/common/views/dashboard/certificates/types";
import { type CertificateListLabels, Translation, useAppTranslation } from "@/shared/locale";

function mapCertificateRow(row: CertificateListRawRow): CertificateListRow {
  return {
    id: row.id ?? "",
    recipientName: row.studentName ?? "",
    templateName: row.templateName ?? "",
    status: row.status ?? "DRAFT",
    issueDate: row.issueDate ?? null,
    verificationCode: row.verificationCode ?? "",
    fileUrl: row.fileUrl ?? null,
  };
}

export interface CertificateListViewModel {
  readonly labels: CertificateListLabels["list"];
  readonly rows: readonly CertificateListRow[];
  readonly totalCount: number | undefined;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly statusFilter: CertificateStatusFilter;
  readonly onStatusFilterChange: (status: CertificateStatusFilter) => void;
  readonly templateFilter: string | null;
  readonly onTemplateFilterChange: (templateId: string | null) => void;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly onDateRangeChange: (from: string | null, to: string | null) => void;
  readonly canGenerate: boolean;
  readonly canDownload: boolean;
  readonly onRetry: () => void;
  readonly onViewCertificate: (id: string) => void;
  readonly isGenerateDialogOpen: boolean;
  readonly onOpenGenerateDialog: () => void;
  readonly onCloseGenerateDialog: () => void;
}

export interface UseCertificateListViewModelProps {
  readonly onRetry?: () => void;
}

export function useCertificateListViewModel(
  _props: UseCertificateListViewModelProps
): CertificateListViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Certificates).list;
  const page = useCertificatesStore(state => state.page);
  const pageSize = useCertificatesStore(state => state.pageSize);
  const search = useCertificatesStore(state => state.search);
  const statusFilter = useCertificatesStore(state => state.statusFilter);
  const templateFilter = useCertificatesStore(state => state.templateFilter);
  const dateFrom = useCertificatesStore(state => state.dateFrom);
  const dateTo = useCertificatesStore(state => state.dateTo);
  const setPage = useCertificatesStore(state => state.setPage);
  const setSearch = useCertificatesStore(state => state.setSearch);
  const setStatusFilter = useCertificatesStore(state => state.setStatusFilter);
  const setTemplateFilter = useCertificatesStore(state => state.setTemplateFilter);
  const setDateRange = useCertificatesStore(state => state.setDateRange);
  const permissions = useUserStore(state => state.permissions);
  const canGenerate = permissions.includes(AppPermission.CertificatesGenerate);
  const canDownload = permissions.includes(AppPermission.CertificatesDownload);

  // Local state for dialog (ephemeral — NOT in Zustand)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(certificatesQueryDocument, {
    variables: {
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
      filterArgs: {
        status: statusFilter === "all" ? null : statusFilter,
        templateId: templateFilter,
        search: search || null,
        issuedFrom: dateFrom || null,
        issuedTo: dateTo || null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  if (error) {
    logger.error("Error loading certificates:", { error });
  }

  const rows = useMemo(
    () => (data?.certificates?.data ?? []).map(mapCertificateRow),
    [data?.certificates?.data]
  );
  const totalCount = data?.certificates?.pageInfo?.total;

  return {
    labels,
    rows,
    totalCount,
    loading,
    error,
    page,
    pageSize,
    onPageChange: setPage,
    search,
    onSearchChange: setSearch,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    templateFilter,
    onTemplateFilterChange: setTemplateFilter,
    dateFrom,
    dateTo,
    onDateRangeChange: setDateRange,
    canGenerate,
    canDownload,
    onRetry: () => { void refetch(); },
    onViewCertificate: (id) => { /* navigate via router */ },
    isGenerateDialogOpen,
    onOpenGenerateDialog: () => setIsGenerateDialogOpen(true),
    onCloseGenerateDialog: () => setIsGenerateDialogOpen(false),
  };
}
```

### 3.3 useCertificateDetailViewModel.ts

```tsx
"use client";

import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { certificateQueryDocument } from "@/frontend/common/graphql/sharedDocuments/cert/certificates.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { type CertificateDetailLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface CertificateDetailViewModel {
  readonly labels: CertificateDetailLabels["detail"];
  readonly certificate: CertificateDetailData | null;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly canRevoke: boolean;
  readonly canDownload: boolean;
  readonly isRevokeDialogOpen: boolean;
  readonly onOpenRevokeDialog: () => void;
  readonly onCloseRevokeDialog: () => void;
  readonly onBackToList: () => void;
  readonly onRetry: () => void;
}

export interface UseCertificateDetailViewModelProps {
  readonly certificateId: string;
  readonly onRetry?: () => void;
}

export function useCertificateDetailViewModel(
  props: UseCertificateDetailViewModelProps
): CertificateDetailViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Certificates).detail;
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);
  const canRevokeBase = permissions.includes(AppPermission.CertificatesRevoke);
  const canDownload = permissions.includes(AppPermission.CertificatesDownload);

  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(certificateQueryDocument, {
    variables: { id: props.certificateId },
    fetchPolicy: "cache-and-network",
  });

  if (error) {
    logger.error("Error loading certificate detail:", { error });
  }

  const certificate = data?.certificate ?? null;
  const isRevoked = certificate?.status === "REVOKED";
  const canRevoke = canRevokeBase && !isRevoked;

  return {
    labels,
    certificate,
    loading,
    error,
    canRevoke,
    canDownload,
    isRevokeDialogOpen,
    onOpenRevokeDialog: () => setIsRevokeDialogOpen(true),
    onCloseRevokeDialog: () => setIsRevokeDialogOpen(false),
    onBackToList: () => router.push("/dashboard/certificates"),
    onRetry: () => { void refetch(); },
  };
}
```

### 3.4 GenerateCertificateDialog.tsx

A client component using MUI `<Dialog>` with `<Stepper>` for the multi-step flow:

```tsx
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
// ... imports ...

export interface GenerateCertificateDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly labels: CertificateListLabels["generate"];
}

export function GenerateCertificateDialog({ open, onClose, labels }: GenerateCertificateDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedRecipientGroupId, setSelectedRecipientGroupId] = useState<string | null>(null);

  // Step 1: query published templates
  const { data: templatesData, loading: templatesLoading } = useQuery(
    publishedCertificateTemplatesQueryDocument,
    { variables: { filterArgs: { status: "PUBLISHED" } }, fetchPolicy: "cache-and-network" }
  );

  // Step 2: query recipient groups
  const { data: recipientGroupsData, loading: recipientGroupsLoading } = useQuery(
    certificateRecipientGroupsQueryDocument,
    { fetchPolicy: "cache-and-network" }
  );

  // Generation mutation
  const [generateCertificate, { loading: generating, error: generateError }] = useMutation(
    generateCertificateMutationDocument
  );

  const handleConfirm = async () => {
    if (!selectedTemplateId || !selectedRecipientGroupId) return;
    const result = await generateCertificate({
      variables: { input: { templateId: selectedTemplateId, recipientGroupId: selectedRecipientGroupId } },
      refetchQueries: [{ query: certificatesQueryDocument, variables: { /* current filters */ } }],
    });
    if (!result.errors) {
      onClose();
      // show success toast with labels.success(count)
    }
  };

  // ... render Dialog with Stepper, step content, navigation buttons ...
}
```

### 3.5 RevokeCertificateDialog.tsx

```tsx
"use client";

import { useMutation } from "@apollo/client/react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert } from "@mui/material";
import { useState } from "react";
import { revokeCertificateMutationDocument } from "@/frontend/common/graphql/sharedDocuments/cert/certificates.documents";

export interface RevokeCertificateDialogProps {
  readonly open: boolean;
  readonly certificateId: string;
  readonly recipientName: string;
  readonly labels: CertificateListLabels["revoke"];
  readonly onClose: () => void;
  readonly onRevoked: () => void;  // refetch callback
}

export function RevokeCertificateDialog(props: RevokeCertificateDialogProps) {
  const [reason, setReason] = useState("");
  const [revokeCertificate, { loading, error }] = useMutation(revokeCertificateMutationDocument);

  const handleConfirm = async () => {
    const result = await revokeCertificate({
      variables: { input: { id: props.certificateId, reason } },
    });
    if (!result.errors) {
      props.onRevoked();
      props.onClose();
      setReason("");
    }
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{props.labels.title}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {props.labels.warning(props.recipientName)}
        </Alert>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
        <TextField
          label={props.labels.reasonLabel}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minRows={3}
          multiline
          fullWidth
          required
          error={reason.length > 0 && reason.length < 10}
          helperText={reason.length < 10 ? props.labels.reasonHelper : ""}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{props.labels.cancel}</Button>
        <Button onClick={handleConfirm} color="error" disabled={loading || reason.length < 10}>
          {loading ? props.labels.revoking : props.labels.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## 4. Tier-Specific Presentation

### 4.1 CertificateListDesktop.tsx (Desktop — Table)

```tsx
"use client";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { DesktopAppDataGrid } from "@/frontend/common/components/ui/dataGrid/DesktopAppDataGrid";
// ... imports for ViewModel type, labels, etc.

export interface CertificateListDesktopProps {
  readonly viewModel: CertificateListViewModel;
}

export function CertificateListDesktop({ viewModel }: CertificateListDesktopProps) {
  const columns: GridColDef[] = [
    { field: "recipientName", headerName: viewModel.labels.recipientName, flex: 1 },
    { field: "templateName", headerName: viewModel.labels.templateName, flex: 1 },
    {
      field: "status",
      headerName: viewModel.labels.status,
      renderCell: (params) => <StatusBadge status={params.value} labels={viewModel.labels.status} />,
      flex: 0.5,
    },
    { field: "issueDate", headerName: viewModel.labels.issueDate, flex: 0.75 },
    { field: "verificationCode", headerName: viewModel.labels.verificationCode, flex: 0.75, renderCell: (params) => <code>{params.value.slice(0, 8)}…</code> },
    {
      field: "actions",
      headerName: viewModel.labels.actions,
      sortable: false,
      renderCell: (params) => (
        <CertificateRowActions row={params.row} viewModel={viewModel} />
      ),
      flex: 0.5,
    },
  ];

  return (
    <DesktopAppDataGrid
      rows={viewModel.rows}
      columns={columns}
      loading={viewModel.loading}
      paginationOptions={{ mode: "server" }}
      // ... server pagination props
    />
  );
}
```

### 4.2 CertificateListMobile.tsx (Mobile — Cards)

```tsx
"use client";

import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
// ... imports

export function CertificateListMobile({ viewModel }: CertificateListMobileProps) {
  return (
    <Stack spacing={2}>
      {viewModel.rows.map((cert) => (
        <Card key={cert.id}>
          <CardActionArea onClick={() => viewModel.onViewCertificate(cert.id)}>
            <CardContent>
              <Typography variant="headlineSm">{cert.recipientName}</Typography>
              <Typography variant="bodyMd" color="text.secondary">{cert.templateName}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <StatusChip status={cert.status} labels={viewModel.labels} />
                <Typography variant="labelUppercase">{cert.issueDate}</Typography>
              </Stack>
              <Typography variant="bodySm" color="text.secondary" sx={{ mt: 0.5 }}>
                {cert.verificationCode.slice(0, 12)}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
```

### 4.3 CertificateDetailDesktop.tsx (Desktop — Split Layout)

```tsx
"use client";

import { Box, Button, Card, Chip, Stack, Typography, IconButton } from "@mui/material";
// ... imports

export function CertificateDetailDesktop({ viewModel }: CertificateDetailDesktopProps) {
  const cert = viewModel.certificate;
  if (!cert) return null;

  return (
    <Stack direction="row" spacing={3}>
      {/* Left panel: metadata + QR code */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        <StatusBadge status={cert.status} labels={viewModel.labels.status} />
        <Typography variant="headlineLg">{cert.recipientName}</Typography>
        <DetailRow label={viewModel.labels.templateName} value={cert.templateName} />
        <DetailRow label={viewModel.labels.issueDate} value={cert.issueDate} />
        <DetailRow label={viewModel.labels.verificationCode} value={cert.verificationCode} />
        {cert.revokedAt && (
          <Alert severity="error">
            <Typography variant="labelUppercase">{viewModel.labels.revokedAt}: {cert.revokedAt}</Typography>
            <Typography variant="bodyMd">{cert.revocationReason}</Typography>
          </Alert>
        )}
        <QrCode value={`/verify/${cert.verificationCode}`} />
        {viewModel.canDownload && cert.fileUrl && (
          <Button variant="outlined" href={cert.fileUrl} target="_blank" download>
            {viewModel.labels.download}
          </Button>
        )}
        {viewModel.canRevoke && (
          <Button color="error" onClick={viewModel.onOpenRevokeDialog}>
            {viewModel.labels.revoke}
          </Button>
        )}
        <Button onClick={viewModel.onBackToList}>{viewModel.labels.backToList}</Button>
      </Stack>

      {/* Right panel: PDF preview */}
      <Box sx={{ flex: 2 }}>
        {cert.fileUrl && (
          <iframe src={cert.fileUrl} title="Certificate PDF" style={{ width: "100%", height: "70vh", border: "none" }} />
        )}
      </Box>
    </Stack>
  );
}
```

### 4.4 CertificateDetailMobile.tsx (Mobile — Stacked)

```tsx
"use client";

export function CertificateDetailMobile({ viewModel }: CertificateDetailMobileProps) {
  const cert = viewModel.certificate;
  if (!cert) return null;

  return (
    <Stack spacing={2}>
      <StatusBadge status={cert.status} labels={viewModel.labels.status} />
      <Typography variant="headlineMd">{cert.recipientName}</Typography>
      <DetailRow label={viewModel.labels.templateName} value={cert.templateName} />
      <DetailRow label={viewModel.labels.issueDate} value={cert.issueDate} />
      <DetailRow label={viewModel.labels.verificationCode} value={cert.verificationCode} />

      {cert.thumbnailUrl && <img src={cert.thumbnailUrl} alt="Certificate preview" style={{ width: "100%" }} />}

      <QrCode value={`/verify/${cert.verificationCode}`} />

      {viewModel.canDownload && cert.fileUrl && (
        <Button fullWidth variant="outlined" href={cert.fileUrl} target="_blank" download>
          {viewModel.labels.download}
        </Button>
      )}
      {viewModel.canRevoke && (
        <Button fullWidth color="error" onClick={viewModel.onOpenRevokeDialog}>
          {viewModel.labels.revoke}
        </Button>
      )}
      <Button fullWidth onClick={viewModel.onBackToList}>{viewModel.labels.backToList}</Button>
    </Stack>
  );
}
```

---

## 5. Public Verification Page (frontend/common/views/public/verify/)

### 5.1 CertificateVerifyPage.tsx

A shared client component (not split into mobile/desktop — uses MUI responsive utilities):

```tsx
"use client";

import { Box, Button, Chip, Container, Stack, Typography, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CertificateVerifyLabels {
  readonly pageTitle: string;
  readonly valid: string;
  readonly expired: string;
  readonly revoked: string;
  readonly notFound: string;
  readonly recipientName: string;
  readonly issueDate: string;
  readonly templateName: string;
  readonly academyName: string;
  readonly verificationCode: string;
  readonly statusLabel: string;
  readonly revocationReason: string;
  readonly verifyAnother: string;
  readonly scanQrCode: string;
}

export interface CertificateVerifyData {
  readonly templateName: string;
  readonly recipientName: string;
  readonly issueDate: string;
  readonly status: "VALID" | "EXPIRED" | "REVOKED";
  readonly academyName: string;
  readonly verificationCode: string;
  readonly revocationReason: string | null;
}

export interface CertificateVerifyPageProps {
  readonly certificate: CertificateVerifyData | null;
  readonly labels: CertificateVerifyLabels;
}

function StatusBadge({ status, labels }: { status: string; labels: CertificateVerifyLabels }) {
  if (status === "VALID") return <Chip label={labels.valid} color="success" />;
  if (status === "EXPIRED") return <Chip label={labels.expired} color="warning" />;
  return <Chip label={labels.revoked} color="error" />;
}

export function CertificateVerifyPage({ certificate, labels }: CertificateVerifyPageProps) {
  const router = useRouter();
  const [verifyInput, setVerifyInput] = useState("");

  if (!certificate) {
    return (
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center" sx={{ py: 8 }}>
          <Typography variant="headlineLg">{labels.notFound}</Typography>
          <TextField
            label={labels.verifyAnother}
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
          />
          <Button variant="contained" onClick={() => router.push(`/verify/${verifyInput}`)}>
            {labels.verifyAnother}
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Stack spacing={3} sx={{ py: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="headlineLg">{labels.pageTitle}</Typography>
          <StatusBadge status={certificate.status} labels={labels} />
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <DetailRow label={labels.recipientName} value={certificate.recipientName} />
              <DetailRow label={labels.templateName} value={certificate.templateName} />
              <DetailRow label={labels.issueDate} value={certificate.issueDate} />
              <DetailRow label={labels.academyName} value={certificate.academyName} />
              <DetailRow label={labels.verificationCode} value={certificate.verificationCode} />
              {certificate.status === "REVOKED" && certificate.revocationReason && (
                <Alert severity="error">
                  <Typography variant="labelUppercase">{labels.revocationReason}</Typography>
                  <Typography variant="bodyMd">{certificate.revocationReason}</Typography>
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="bodySm" color="text.secondary">{labels.scanQrCode}</Typography>
          <QrCode value={`/verify/${certificate.verificationCode}`} />
        </Box>

        <TextField
          label={labels.verifyAnother}
          value={verifyInput}
          onChange={(e) => setVerifyInput(e.target.value)}
        />
        <Button
          variant="outlined"
          onClick={() => router.push(`/verify/${verifyInput}`)}
        >
          {labels.verifyAnother}
        </Button>
      </Stack>
    </Container>
  );
}
```

---

## 6. GraphQL Documents (frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts)

```tsx
import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { Operations } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { Types } from "@/backend/types";

// ─── List Query ──────────────────────────────────────────────────────────
export const certificatesQueryDocument = gql`
  query Certificates($paginationArgs: PaginationArgs!, $filterArgs: CertificateFilterArgs) {
    certificates(paginationArgs: $paginationArgs, filterArgs: $filterArgs) {
      data {
        id
        studentName
        templateName
        status
        issueDate
        verificationCode
        fileUrl
        thumbnailUrl
      }
      pageInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
` as TypedDocumentNode<Operations.CertificatesQuery, Types.CertificatesQueryArgs>;

// ─── Detail Query ────────────────────────────────────────────────────────
export const certificateQueryDocument = gql`
  query Certificate($id: ID!) {
    certificate(id: $id) {
      id
      studentName
      templateName
      status
      issueDate
      expiryDate
      verificationCode
      fileUrl
      thumbnailUrl
      revokedAt
      revocationReason
      version
      createdAt
    }
  }
` as TypedDocumentNode<Operations.CertificateQuery, Types.CertificateQueryArgs>;

// ─── Generate Mutation ───────────────────────────────────────────────────
export const generateCertificateMutationDocument = gql`
  mutation GenerateCertificate($input: GenerateCertificateInput!) {
    generateCertificate(input: $input) {
      id
      successCount
    }
  }
` as TypedDocumentNode<Operations.GenerateCertificateMutation, Types.GenerateCertificateInput>;

// ─── Revoke Mutation ─────────────────────────────────────────────────────
export const revokeCertificateMutationDocument = gql`
  mutation RevokeCertificate($input: RevokeCertificateInput!) {
    revokeCertificate(input: $input) {
      id
      status
      revokedAt
    }
  }
` as TypedDocumentNode<Operations.RevokeCertificateMutation, Types.RevokeCertificateInput>;

// ─── Public Verify Query (NO AUTH — but used internally, public page uses service) ───
export const verifyCertificateQueryDocument = gql`
  query VerifyCertificate($code: String!) {
    verifyCertificate(code: $code) {
      templateName
      recipientName
      issueDate
      status
      academyName
      verificationCode
      revocationReason
    }
  }
` as TypedDocumentNode<Operations.VerifyCertificateQuery, Types.VerifyCertificateQueryArgs>;

// ─── Recipient Groups Query (for generation dialog) ──────────────────────
export const certificateRecipientGroupsQueryDocument = gql`
  query CertificateRecipientGroups {
    certificateRecipientGroups {
      id
      name
      recipientCount
      studentIds
    }
  }
` as TypedDocumentNode<Operations.CertificateRecipientGroupsQuery, Types.CertificateRecipientGroupsQueryArgs>;

// ─── Published Templates Query (for generation dialog step 1) ────────────
export const publishedCertificateTemplatesQueryDocument = gql`
  query PublishedCertificateTemplates($filterArgs: TemplateFilterArgs) {
    certificateTemplates(filterArgs: $filterArgs) {
      id
      name
      description
      status
      orientation
      width
      height
      variables {
        id
        variableKey
        variableType
        label
        isRequired
        defaultValue
      }
    }
  }
` as TypedDocumentNode<Operations.PublishedCertificateTemplatesQuery, Types.PublishedCertificateTemplatesQueryArgs>;
```

**Document conventions:**
- Always include `id` field on every object type (Apollo cache normalization)
- Naming: `{entityName}QueryDocument`, `{entityName}MutationDocument`
- Types: `TypedDocumentNode<Operations.XQuery, Types.QueryXArgs>`
- Located in domain subdirectory: `frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts`
- Import from `@apollo/client/react` for hooks (not `@apollo/client`)
- NO `useLazyQuery` — stateful `useQuery` only

---

## 7. Zustand Store (frontend/common/stores/certificatesStore.ts)

```tsx
import { create } from "zustand";

export type CertificateStatusFilter = "all" | "DRAFT" | "ISSUED" | "EXPIRED" | "REVOKED" | "ARCHIVED";

interface CertificatesStoreState {
  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  // Search (debounced by the component, stored here)
  search: string;
  setSearch: (search: string) => void;
  // Filters
  statusFilter: CertificateStatusFilter;
  setStatusFilter: (status: CertificateStatusFilter) => void;
  templateFilter: string | null;
  setTemplateFilter: (templateId: string | null) => void;
  dateFrom: string | null;
  dateTo: string | null;
  setDateRange: (from: string | null, to: string | null) => void;
}

export const useCertificatesStore = create<CertificatesStoreState>((set) => ({
  page: 0,
  pageSize: 20,
  setPage: (page) => set({ page }),
  search: "",
  setSearch: (search) => set({ search, page: 0 }),
  statusFilter: "all",
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  templateFilter: null,
  setTemplateFilter: (templateFilter) => set({ templateFilter, page: 0 }),
  dateFrom: null,
  dateTo: null,
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to, page: 0 }),
}));
```

**Store conventions:**
- Filter/search setters reset `page` to 0 (avoids empty page after filter)
- No `File` objects in store (use `useRef` for ephemeral state)
- Dialog open/close state is NOT in store — local `useState` in container

---

## 8. Navigation Configuration

### 8.1 SIDEBAR_NAV_GROUPS Addition

Add to `SIDEBAR_NAV_GROUPS` in `frontend/common/views/dashboard/config/navigationConfig.ts`:

```ts
{
  id: "grp_certificates",
  labelKey: "navGroupCertificates",
  iconKey: "verified",
  section: "main",
  permission: [
    AppPermission.CertificatesList,
    AppPermission.CertificatesViewOwn,
    AppPermission.CertificatesViewOther,
  ],
  separator: true,
},
```

### 8.2 SIDEBAR_NAV_ITEMS Addition

Add to `SIDEBAR_NAV_ITEMS`:

```ts
{
  key: "certificates",
  labelKey: "certificates",
  iconKey: "verified",
  href: "/dashboard/certificates",
  section: "main",
  groupId: "grp_certificates",
  permission: PAGE_PERMISSIONS.certificatesList,
},
```

### 8.3 PAGE_PERMISSIONS Addition

Add to `frontend/common/types/page-permissions.types.ts`:

```ts
certificatesList: [
  AppPermission.CertificatesList,
  AppPermission.CertificatesViewOwn,
  AppPermission.CertificatesViewOther,
] as PagePermissions,
certificatesDetail: [
  AppPermission.CertificatesViewOwn,
  AppPermission.CertificatesViewOther,
] as PagePermissions,
// Public verification — NO permission (accessible to all)
certificatesVerifyPublic: [] as PagePermissions,
```

### 8.4 Role Access Matrix

| Role | List | Generate | View Own | View Other | Revoke | Download | Public Verify |
|------|------|----------|----------|-----------|--------|----------|---------------|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| academy_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| teacher_default | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| student_default | ✅ (own only) | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| parent_default | ✅ (children) | ❌ | ✅ (children) | ❌ | ❌ | ✅ | ✅ |
| staff_default | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| supervisor_default | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| unauthenticated | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 9. Routes Summary

| Route | Location | Auth | Permission | Layout |
|-------|----------|------|------------|--------|
| `/dashboard/certificates` | `app/(dashboard)/dashboard/certificates/page.tsx` | Required | `CERTIFICATES_LIST` OR `CERTIFICATES_VIEW_OWN` OR `CERTIFICATES_VIEW_OTHER` | Dashboard (sidebar + nav) |
| `/dashboard/certificates/[id]` | `app/(dashboard)/dashboard/certificates/[id]/page.tsx` | Required | `CERTIFICATES_VIEW_OWN` OR `CERTIFICATES_VIEW_OTHER` | Dashboard (sidebar + nav) |
| `/verify/[code]` | `app/[locale]/verify/[code]/page.tsx` | NOT required | None (public) | Standalone (no sidebar) |

---

## 10. Component Patterns Compliance

### 10.1 MUI v9 Rules

- **NO style props** — use `sx` prop: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`
- **Theme callback**: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- **Material 3 on<Color> siblings**: `theme.palette.onPrimary` (not `contrastText`)
- **Typography variants**: `headlineLg`, `headlineMd`, `headlineSm`, `titleLg`, `labelUppercase`, `bodyMd`, `bodyLg`, `bodySm`
- **Icons**: `*Outlined` (not `*Outline`) — e.g., `VerifiedOutlined`, `DownloadOutlined`, `RevokeOutlined`

### 10.2 React 19 Rules

- `React.SubmitEvent` (not `FormEvent`)
- Cast FormData: `(formData.get("name") as string | null) ?? ""`

### 10.3 Apollo Client v4 Rules

- Import from `@apollo/client/react` (not `@apollo/client` for hooks)
- NO `useLazyQuery` — stateful `useQuery` exclusively
- `fetchPolicy: "cache-and-network"` for list/detail queries
- `useMutation` with `refetchQueries` for mutations that invalidate list

### 10.4 Logging

- `import { logger } from "@/frontend/common/utils/logger"` (frontend)
- NEVER `console.*` — ESLint will error

### 10.5 Path Aliases

- All imports use `@/` prefix: `@/frontend/common/...`, `@/backend/...`, `@/shared/...`
- NEVER relative `./` or `../` imports

---

## 11. UX/Navigation Specification

### 11.1 Sidebar Integration

- **Group**: "Certificates" group (`grp_certificates`) with `verified` icon
- **Item**: "Certificates" nav item (`key: "certificates"`) linking to `/dashboard/certificates`
- **Placement**: Appears after the `grp_reports` group, before `grp_feedback`
- **Separator**: Yes — groups are visually separated with a divider

### 11.2 Route Access

- **Super admin / Academy admin**: Full access — list, generate, view all, revoke, download
- **Teacher**: List (scoped to own students), generate, view own teaching certificates, download
- **Student**: List (scoped to own), view own, download — no generate, no revoke
- **Parent**: List (scoped to children), view children's certificates, download — no generate, no revoke
- **Staff / Supervisor**: List, view all, download — no generate, no revoke
- **Public**: `/verify/[code]` only — no dashboard access, no sidebar

### 11.3 Status Badge Colors

| Status | Color | MUI `color` prop | Arabic label key | English label |
|--------|-------|-------------------|-----------------|---------------|
| VALID (ISSUED) | Green | `success` | `labels.status.ISSUED` | "Valid" |
| EXPIRED | Amber | `warning` | `labels.status.EXPIRED` | "Expired" |
| REVOKED | Red | `error` | `labels.status.REVOKED` | "Revoked" |
| DRAFT | Neutral | `default` | `labels.status.DRAFT` | "Draft" |
| ARCHIVED | Neutral | `default` | `labels.status.ARCHIVED` | "Archived" |

---

## 12. Outcome & Knowledge Transfer Protocol

### 12.1 Knowledge to Document

After implementation, document the following patterns discovered/used:

1. **Public route pattern** — Server Component calling service directly, no auth, `[locale]` in URL, standalone layout. Document in frontend AGENTS.md or design docs.
2. **Multi-step dialog pattern** — MUI `<Stepper>` + local `useState` (not Zustand) for ephemeral dialog form state. Document if not already in the codebase.
3. **QR code integration** — Library choice (`qrcode.react`), QR component pattern for rendering verification URLs. Document in component docs.
4. **Certificate-list server-side pagination** — `AppDataGrid` with `paginationOptions: { mode: "server" }` pattern for the certificate domain.
5. **Mutation + `refetchQueries` pattern** — How to refetch the certificate list after generation/revocation mutations.

### 12.2 Files to Update

| File | What to Update |
|------|---------------|
| `frontend/AGENTS.md` | Certificate frontend patterns: three-location split, dialog pattern, public route pattern |
| `frontend/views/AGENTS.md` | Certificate domain-specific notes if non-obvious patterns discovered |
| `app/AGENTS.md` | Public route pattern (no auth, service call, standalone layout) — if not already documented |
| `.agents/instructions/frontend.instructions.md` | Certificate domain-specific instructions if needed |
| `frontend/COMPONENT_PATTERNS.md` | Generate dialog multi-step pattern, status badge component, QR code component |

### 12.3 Knowledge Propagation Verification

- [ ] Run `bun tsgo` — no type errors in certificate files
- [ ] Run `bun biome:check` on all new certificate files — no formatting issues
- [ ] Run lint queue client on certificate files — no lint errors
- [ ] Verify translation keys exist in `shared/locale/` namespace `dashboard.certificates` (from Plan 09)
- [ ] Verify `AppPermission.CERTIFICATES_*` entries exist in the codegen output (from Plan 02)
- [ ] Verify GraphQL documents match Pothos schema (from Plan 05)
- [ ] Verify sidebar nav item renders for users with certificate permissions
- [ ] Verify public verification page loads without authentication

---

## 13. Error Handling

### 13.1 Query Errors

- List page: show error alert with retry button (`viewModel.onRetry`)
- Detail page: show "Certificate not found" with back-to-list link
- Public verify: show "Certificate not found" with verify-another input

### 13.2 Mutation Errors

- Generate: error alert within dialog (not toast) — errors are actionable and may require retry
- Revoke: error alert within dialog

### 13.3 Not Found

- Detail page (`/dashboard/certificates/[id]`): show centered message with "Back to List" button
- Public verify (`/verify/[code]`): show centered "Not Found" card with "Verify Another" input

---

## 14. Testing Strategy (Reference)

Testing is covered in Plan 10 (Testing & Knowledge Propagation).
