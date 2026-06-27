"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { InvoiceType, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import ParentProfileEditView from "./ParentProfileEditView";
import type { ParentProfileEditFormData } from "./parentProfileEditSchema";
import { parentProfileEditSchema } from "./parentProfileEditSchema";

interface ParentProfileEditContainerProps {
  readonly id: string;
}

export default function ParentProfileEditContainer({ id }: ParentProfileEditContainerProps) {
  const t = useTranslations("dashboard.parentProfile");
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
    skype: profile?.skype ?? "",
    defaultZoomLink: profile?.defaultZoomLink ?? "",
    invoiceType: (profile?.invoiceType as InvoiceType) ?? InvoiceType.Monthly,
    feeAmount: profile?.feeAmount ?? "",
    paymentMethod: (profile?.paymentMethod as PaymentMethod) ?? PaymentMethod.Paypal,
    currency: profile?.currency ?? "USD",
  };

  const {
    register,
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
        skype: profile.skype ?? "",
        defaultZoomLink: profile.defaultZoomLink ?? "",
        invoiceType: (profile.invoiceType as InvoiceType) ?? InvoiceType.Monthly,
        feeAmount: profile.feeAmount ?? "",
        paymentMethod: (profile.paymentMethod as PaymentMethod) ?? PaymentMethod.Paypal,
        currency: profile.currency ?? "USD",
      });
    }
  }, [profile, reset]);

  const onSubmit = (formData: ParentProfileEditFormData) => {
    logger.info("Profile edit submitted", { parentId, formData });
    router.push(`/parents/${parentId}/profile`);
  };

  if (!parentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Typography sx={{ color: theme => theme.palette.error.main }}>
        {error?.message ?? t("errors.notFound")}
      </Typography>
    );
  }

  return <ParentProfileEditView register={register} errors={errors} handleSubmit={handleSubmit} onSubmit={onSubmit} />;
}
