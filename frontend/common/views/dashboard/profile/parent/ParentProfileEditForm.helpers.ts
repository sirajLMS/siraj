"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchemaFactory,
  parentOwnEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";

export type ParentEditFormSubmit = (values: ParentAdminEditFormData) => Promise<void>;

const EMPTY_DEFAULTS: ParentAdminEditFormData = {
  name: "",
  email: "",
  avatarUrl: null,
  phone: "",
  facebook: "",
  whatsapp: "",
  twitter: "",
  nationality: "",
  address: "",
  invoiceType: "",
  feeAmount: "",
  currency: undefined,
  timezone: "",
  lifecycleStatus: ParentStatus.Regular,
  displayCurrency: null,
};

function buildFormDefaults(parentData: ParentEditData): ParentAdminEditFormData {
  return {
    name: parentData.name ?? "",
    email: parentData.email ?? "",
    avatarUrl: parentData.avatarUrl ?? null,
    phone: parentData.phone ?? "",
    facebook: parentData.facebook ?? "",
    whatsapp: parentData.whatsapp ?? "",
    twitter: parentData.twitter ?? "",
    nationality: parentData.nationality ?? "",
    address: parentData.address ?? "",
    invoiceType: parentData.invoiceType ?? "",
    feeAmount: parentData.feeAmount ?? "",
    currency: parentData.currency ?? undefined,
    timezone: parentData.timezone ?? "",
    lifecycleStatus: parentData.lifecycleStatus ?? ParentStatus.Regular,
    displayCurrency: parentData.displayCurrency ?? null,
  };
}

export function useParentEditForm(parentData: ParentEditData, isAdminScope: boolean, invalidTimezone: string) {
  const schema = isAdminScope
    ? parentAdminEditSchemaFactory({ invalidTimezone })
    : parentOwnEditSchemaFactory({ invalidTimezone });
  const form = useForm<ParentAdminEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    form.reset(buildFormDefaults(parentData));
  }, [form, parentData]);

  return form;
}
