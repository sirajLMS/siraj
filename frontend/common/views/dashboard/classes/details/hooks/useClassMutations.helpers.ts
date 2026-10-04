import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";

type ClassInstanceVariables = { readonly classInstanceId: string };

type LeaveVariables = { readonly classInstanceId: string; readonly leaveReason: string };

type OverrideRateVariables = {
  readonly classInstanceId: string;
  readonly rateAmount: string | null;
  readonly rateCurrency: CurrencyCode | null;
};

type InstanceTrigger = (options: { variables: ClassInstanceVariables }) => Promise<unknown>;

type LifecycleTriggers = {
  readonly forceActivate: InstanceTrigger;
  readonly activate: InstanceTrigger;
  readonly stopClass: InstanceTrigger;
  readonly deleteClass: InstanceTrigger;
};

type SessionTriggers = {
  readonly start: InstanceTrigger;
  readonly markAbsent: InstanceTrigger;
  readonly processLeave: (options: { variables: LeaveVariables }) => Promise<unknown>;
  readonly reset: InstanceTrigger;
  readonly overrideRate: (options: { variables: OverrideRateVariables }) => Promise<unknown>;
};

/** Lifecycle actions (activate/stop/delete) bound to the class instance id. */
export function buildLifecycleHandlers(id: string, triggers: LifecycleTriggers) {
  return {
    forceActivate: async () => {
      await triggers.forceActivate({ variables: { classInstanceId: id } });
      logger.info("Admin force-activated session:", id);
    },
    activate: async () => {
      await triggers.activate({ variables: { classInstanceId: id } });
      logger.info("Teacher activated session:", id);
    },
    stopClass: async () => {
      await triggers.stopClass({ variables: { classInstanceId: id } });
      logger.info("Stopped session:", id);
    },
    deleteClass: async () => {
      await triggers.deleteClass({ variables: { classInstanceId: id } });
      logger.warn("Deleted class instance:", id);
    },
  };
}

/** Session status transitions and rate override bound to the class instance id. */
export function buildSessionHandlers(id: string, triggers: SessionTriggers) {
  return {
    startSession: async () => {
      await triggers.start({ variables: { classInstanceId: id } });
    },
    markAbsent: async () => {
      await triggers.markAbsent({ variables: { classInstanceId: id } });
    },
    processLeave: async (reason: string) => {
      await triggers.processLeave({ variables: { classInstanceId: id, leaveReason: reason } });
    },
    resetSession: async () => {
      await triggers.reset({ variables: { classInstanceId: id } });
    },
    overrideRate: async (rateAmount: string | null, rateCurrency: CurrencyCode | null) => {
      await triggers.overrideRate({ variables: { classInstanceId: id, rateAmount, rateCurrency } });
    },
  };
}
