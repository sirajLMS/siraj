"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CurrencyCode, InvoiceType, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { profileHrefForParent } from "@/frontend/utils/profileHref";
import ParentProfileEditView from "@/frontend/views/dashboard/parent/profile/edit/ParentProfileEditView";
import type { ParentProfileEditFormData } from "@/frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema";
import { parentProfileEditSchema } from "@/frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema";
import { useRouter } from "@/shared/i18n/routing";

interface ParentProfileEditContainerProps {
  readonly id: string;
}

export default function ParentProfileEditContainer({ id }: ParentProfileEditContainerProps) {
  const t = useTranslations("dashboard.parentProfile");
  const tc = useTranslations("common");
  const router = useRouter();
  const parentId = id;

  const { data, loading, error } = useQuery(parentProfileQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const profile = data?.parentProfile;

  const defaultValues: ParentProfileEditFormData = {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    nationality: profile?.nationality ?? "",
    address: profile?.address ?? "",
    whatsapp: profile?.whatsapp ?? "",
    facebook: profile?.facebook ?? "",
    twitter: profile?.twitter ?? "",
    invoiceType: (profile?.invoiceType as InvoiceType) ?? InvoiceType.Monthly,
    feeAmount: profile?.feeAmount ?? "",
    paymentMethod: (profile?.paymentMethod as PaymentMethod) ?? PaymentMethod.Paypal,
    currency: profile?.currency ?? CurrencyCode.Usd,
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParentProfileEditFormData>({
    resolver: zodResolver(parentProfileEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        nationality: profile.nationality ?? "",
        address: profile.address ?? "",
        whatsapp: profile.whatsapp ?? "",
        facebook: profile.facebook ?? "",
        twitter: profile.twitter ?? "",
        invoiceType: (profile.invoiceType as InvoiceType) ?? InvoiceType.Monthly,
        feeAmount: profile.feeAmount ?? "",
        paymentMethod: (profile.paymentMethod as PaymentMethod) ?? PaymentMethod.Paypal,
        currency: profile.currency ?? CurrencyCode.Usd,
      });
    }
  }, [profile, reset]);

  const onSubmit = (formData: ParentProfileEditFormData) => {
    logger.info("Profile edit submitted", { parentId, formData });
    const profileHref = profileHrefForParent({ userId: profile?.userId, parentId });
    if (profileHref) {
      router.push(profileHref);
    }
  };

  if (!parentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    logger.error("Error loading parent profile for edit:", { error });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  return (
    <ParentProfileEditView
      register={register}
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
    />
  );
}
