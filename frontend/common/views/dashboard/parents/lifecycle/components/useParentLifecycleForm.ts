"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type LifecycleUpdateFormData,
  lifecycleUpdateSchema,
} from "@/frontend/common/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";

export function useParentLifecycleForm(parent: ParentLifecycleViewProps["parent"]) {
  const methods = useForm<LifecycleUpdateFormData>({
    resolver: zodResolver(lifecycleUpdateSchema),
    defaultValues: {
      lifecycleStatus: ParentStatus.Regular,
      reason: "",
    },
  });

  useEffect(() => {
    methods.reset({
      lifecycleStatus: parent.lifecycleStatus,
      reason: "",
    });
  }, [parent, methods]);

  return methods;
}

export function useParentLifecycleProfileHref(parent: ParentLifecycleViewProps["parent"]): string | undefined {
  return profileHrefForParent({ userId: parent.userId, parentId: parent.id }) ?? undefined;
}
