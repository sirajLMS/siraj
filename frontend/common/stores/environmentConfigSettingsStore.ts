import { create } from "zustand";

interface EnvironmentConfigSettingsUiState {
  readonly draftValues: Readonly<Record<string, string>>;
  readonly savingKeys: Readonly<Record<string, boolean>>;
  readonly revealedKeys: Readonly<Record<string, boolean>>;
  readonly expandedCategories: Readonly<Record<string, boolean>>;
  readonly draftsHydrated: boolean;
  readonly setDraftValues: (draftValues: Record<string, string>) => void;
  readonly mergeDraftValues: (draftValues: Record<string, string>) => void;
  readonly setDraftValue: (key: string, value: string) => void;
  readonly removeDraftValue: (key: string) => void;
  readonly setSaving: (key: string, saving: boolean) => void;
  readonly toggleSecretRevealed: (key: string) => void;
  readonly setCategoryExpanded: (category: string, expanded: boolean) => void;
  readonly setDraftsHydrated: (hydrated: boolean) => void;
  readonly reset: () => void;
}

const initialState = {
  draftValues: {} as Record<string, string>,
  savingKeys: {} as Record<string, boolean>,
  revealedKeys: {} as Record<string, boolean>,
  expandedCategories: {} as Record<string, boolean>,
  draftsHydrated: false,
};

export const useEnvironmentConfigSettingsStore = create<EnvironmentConfigSettingsUiState>(set => ({
  ...initialState,
  setDraftValues: draftValues => set({ draftValues }),
  mergeDraftValues: incoming =>
    set(state => {
      const merged = { ...state.draftValues };

      for (const [key, value] of Object.entries(incoming)) {
        if (!(key in merged)) {
          merged[key] = value;
        }
      }

      return { draftValues: merged, draftsHydrated: true };
    }),
  setDraftValue: (key, value) =>
    set(state => ({
      draftValues: {
        ...state.draftValues,
        [key]: value,
      },
    })),
  removeDraftValue: key =>
    set(state => {
      const next = { ...state.draftValues };
      delete next[key];
      return { draftValues: next };
    }),
  setSaving: (key, saving) =>
    set(state => ({
      savingKeys: {
        ...state.savingKeys,
        [key]: saving,
      },
    })),
  toggleSecretRevealed: key =>
    set(state => ({
      revealedKeys: {
        ...state.revealedKeys,
        [key]: !state.revealedKeys[key],
      },
    })),
  setCategoryExpanded: (category, expanded) =>
    set(state => ({
      expandedCategories: {
        ...state.expandedCategories,
        [category]: expanded,
      },
    })),
  setDraftsHydrated: hydrated => set({ draftsHydrated: hydrated }),
  reset: () => set(initialState),
}));
