import { beforeEach, describe, expect, test } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useClassDetailsStore } from "@/frontend/common/stores/classDetailsStore";
import { buildOverrideRateDialog } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type { ClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/types";

type OverrideCall = readonly [amount: string | null, currency: CurrencyCode | null];

const noopAsync = () => Promise.resolve();

function recordOverrideHandlers(calls: OverrideCall[]): ClassActionHandlers {
  return {
    handleForceActivate: noopAsync,
    handleStop: noopAsync,
    handleActivate: noopAsync,
    handleDeleteConfirm: noopAsync,
    handleReschedule: () => {},
    handleInfoEdit: () => {},
    handleOverrideRate: async (rateAmount: string | null, rateCurrency: CurrencyCode | null) => {
      calls.push([rateAmount, rateCurrency]);
    },
  };
}

function storeSlice() {
  const state = useClassDetailsStore.getState();
  return {
    open: state.overrideDialogOpen,
    amount: state.overrideRateAmount,
    currency: state.overrideRateCurrency,
    setAmount: state.setOverrideRateAmount,
    setCurrency: state.setOverrideRateCurrency,
    setOpen: state.setOverrideDialogOpen,
    openDialog: state.openOverrideDialog,
  };
}

describe("override-rate dialog store slice + ViewModel builder", () => {
  beforeEach(() => {
    useClassDetailsStore.getState().reset();
  });

  test("onOpen seeds the amount and currency and opens the dialog", () => {
    const calls: OverrideCall[] = [];
    const dialog = buildOverrideRateDialog(storeSlice(), recordOverrideHandlers(calls), "60", CurrencyCode.Sar);

    dialog.onOpen();

    const state = useClassDetailsStore.getState();
    expect(state.overrideDialogOpen).toBe(true);
    expect(state.overrideRateAmount).toBe("60");
    expect(state.overrideRateCurrency).toBe(CurrencyCode.Sar);
    expect(calls).toHaveLength(0);
  });

  test("onClose closes the dialog without submitting", () => {
    const calls: OverrideCall[] = [];
    useClassDetailsStore.getState().openOverrideDialog("60", CurrencyCode.Sar);
    const dialog = buildOverrideRateDialog(storeSlice(), recordOverrideHandlers(calls), "", null);

    dialog.onClose();

    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
    expect(calls).toHaveLength(0);
  });

  test("submitting a rate forwards amount and currency, then closes the dialog", async () => {
    const calls: OverrideCall[] = [];
    useClassDetailsStore.getState().openOverrideDialog("60", null);
    const state = useClassDetailsStore.getState();
    state.setOverrideRateAmount("120.50");
    state.setOverrideRateCurrency(CurrencyCode.Sar);
    const dialog = buildOverrideRateDialog(storeSlice(), recordOverrideHandlers(calls), "", null);

    await dialog.onSubmit(false);

    expect(calls).toEqual([["120.50", CurrencyCode.Sar]]);
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
  });

  test("submit-clear sends nulls and closes the dialog", async () => {
    const calls: OverrideCall[] = [];
    useClassDetailsStore.getState().openOverrideDialog("60", CurrencyCode.Sar);
    const dialog = buildOverrideRateDialog(storeSlice(), recordOverrideHandlers(calls), "", null);

    await dialog.onSubmit(true);

    expect(calls).toEqual([[null, null]]);
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
  });

  test("an empty amount submits as a clear (null, null)", async () => {
    const calls: OverrideCall[] = [];
    useClassDetailsStore.getState().openOverrideDialog("   ", CurrencyCode.Sar);
    const dialog = buildOverrideRateDialog(storeSlice(), recordOverrideHandlers(calls), "", null);

    await dialog.onSubmit(false);

    expect(calls).toEqual([[null, null]]);
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(false);
  });

  test("a rejected submission keeps the dialog open", async () => {
    const handlers = recordOverrideHandlers([]);
    const failingHandlers: ClassActionHandlers = {
      ...handlers,
      handleOverrideRate: () => Promise.reject(new Error("mutation failed")),
    };
    useClassDetailsStore.getState().openOverrideDialog("60", CurrencyCode.Sar);
    const dialog = buildOverrideRateDialog(storeSlice(), failingHandlers, "", null);

    let thrown: unknown = null;
    try {
      await dialog.onSubmit(false);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(useClassDetailsStore.getState().overrideDialogOpen).toBe(true);
  });
});
