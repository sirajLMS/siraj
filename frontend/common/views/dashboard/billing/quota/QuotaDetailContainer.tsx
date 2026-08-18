"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { QuotaDetailLoadingSkeleton } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaDetailLoadingSkeleton";
import {
  type QuotaDetailViewModel,
  useQuotaDetailViewModel,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";

const lazyViews = createLazyView<QuotaDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaDetail.mobile").then(m => ({
      default: m.QuotaDetailMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop").then(m => ({
      default: m.QuotaDetailDesktop,
    }))
);

interface QuotaDetailContainerProps {
  readonly quotaId: string;
}

function QuotaDetailNotFound({
  title,
  message,
  backButton,
}: Readonly<{ title: string; message: string; backButton: string }>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 8 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={theme => ({ color: theme.palette.text.secondary })}>
        {message}
      </Typography>
      <Link href="/quotas" style={{ textDecoration: "none" }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined">
          {backButton}
        </Button>
      </Link>
    </Box>
  );
}

export function QuotaDetailContainer(props: Readonly<QuotaDetailContainerProps>) {
  const { quotaId } = props;

  const viewModel = useQuotaDetailViewModel(quotaId);

  if (viewModel.loadingQuota) {
    return <QuotaDetailLoadingSkeleton />;
  }

  if (viewModel.notFound || !viewModel.quota) {
    return (
      <QuotaDetailNotFound
        title={viewModel.t.notFoundTitle}
        message={viewModel.t.notFoundMessage}
        backButton={viewModel.t.notFoundBackButton}
      />
    );
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
