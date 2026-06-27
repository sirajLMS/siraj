"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useCreateManagerMutation } from "@/frontend/stores/managerOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { ManagerOnboardingView } from "./ManagerOnboardingView";
import { type ManagerOnboardingFormData, managerOnboardingSchema } from "./schemas/managerOnboardingSchema";

import { ManagerAccountType } from "./types";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  skypeId: "",
  accountType: ManagerAccountType.Manager,
  password: "",
};

export function ManagerOnboardingContainer() {
  const router = useRouter();
  const { execute, loading } = useCreateManagerMutation();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ManagerOnboardingFormData>({
    resolver: zodResolver(managerOnboardingSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess]);

  const onSubmit = async (formData: ManagerOnboardingFormData) => {
    try {
      logger.info("Submitting manager onboarding form", { formData });
      await execute(formData);
      logger.info("Manager onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm();
      router.push("/managers");
    } catch (error) {
      logger.error("Failed to submit manager onboarding form", { error });
    }
  };

  const onCancel = () => {
    router.push("/managers");
  };

  return (
    <RequirePermission permissions={[AppPermission.StaffCreate]}>
      <ManagerOnboardingView
        register={register}
        control={control}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={loading}
        showSuccess={showSuccess}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDismissSuccess={() => {
          setShowSuccess(false);
        }}
      />
    </RequirePermission>
  );
}
