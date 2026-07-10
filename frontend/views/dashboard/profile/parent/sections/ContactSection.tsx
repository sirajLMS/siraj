"use client";

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import type { ParentViewData } from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CoreContactSection } from "@/frontend/views/dashboard/profile/shared/sections/CoreContactSection";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly scope?: ProfileScope;
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly scope?: ProfileScope;
      readonly control: Control<ParentAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.parent");

  if (props.mode === "edit") {
    return (
      <CoreContactSection
        mode="edit"
        scope={props.scope}
        sectionTitle={t("sections.contact")}
        phoneLabel={t("fields.phone")}
        control={props.control}
      />
    );
  }

  return (
    <CoreContactSection
      mode="view"
      scope={props.scope}
      phone={props.parentData.phone}
      sectionTitle={t("sections.contact")}
      phoneLabel={t("fields.phone")}
    />
  );
}
