# Implementation Learnings

This document records the learning outcomes from encountering errors during implementation tasks, preventing them from happening again and reducing future effort.

## 1. Nested Ternary Operators (`typescript:S3358`)
- **Error:** SonarQube flags nested ternary operators (e.g., `condition1 ? value1 : condition2 ? value2 : value3`) as a code smell because they reduce readability.
- **Fix:** Extract nested ternaries into standard `if/else` block statements or standalone variables.
- **Example:**
  ```tsx
  // BAD
  const bgColor = status === "present" ? "green" : status === "absent" ? "red" : "gray";

  // GOOD
  let bgColor = "gray";
  if (status === "present") bgColor = "green";
  else if (status === "absent") bgColor = "red";
  ```

## 2. Negated Conditions in Ternary Operators (`typescript:S7735`)
- **Error:** SonarQube flags negated conditions in ternary operators (e.g., `condition !== null ? value1 : value2`) as they are harder to parse mentally.
- **Fix:** Use positive conditions and swap the branches.
- **Example:**
  ```tsx
  // BAD
  const value = item !== null ? item.value : undefined;

  // GOOD
  const value = item === null ? undefined : item.value;
  ```

## 3. Explicit `any` Types in TypeScript (`@typescript-eslint/no-explicit-any`)
- **Error:** ESLint flags the use of `any` type which bypasses TypeScript's safety features.
- **Fix:** Avoid `any` by defining specific types or generic structures, particularly for external library functions like `next-intl`.
- **Example (next-intl):**
  ```tsx
  // BAD
  type TranslationFn = (key: any, values?: any) => string;

  // GOOD
  type TranslationFn = (key: string, values?: Record<string, string | number>) => string;
  ```

## 4. `Readonly` Component Props (`sonarjs/prefer-read-only-props`)
- **Error:** SonarQube requires React component props to be marked as readonly to enforce immutability.
- **Fix:** Wrap the props interface in `Readonly<T>` directly in the component signature.
- **Example:**
  ```tsx
  // BAD
  export function MyComponent({ title }: MyComponentProps) { ... }

  // GOOD
  export function MyComponent({ title }: Readonly<MyComponentProps>) { ... }
  ```

## 5. Array Index Keys (`lint/suspicious/noArrayIndexKey`)
- **Error:** Biome flags using the array index (`i`) as a `key` prop in React lists because reordering items can lead to bugs and poor performance.
- **Fix:** Provide objects with reliable, unique identifiers (`id`) and use those as keys instead of the `.map` index.
- **Example:**
  ```tsx
  // BAD
  {[10, 20, 30].map((val, i) => <Box key={i} />)}

  // GOOD
  const data = [{ id: 'a', val: 10 }, { id: 'b', val: 20 }];
  {data.map((item) => <Box key={item.id} />)}
  ```

## 6. Type Safety for Dictionaries (`Record` vs `Partial<Record>`)
- **Error:** When accessing items from a `Record<number, T>`, TypeScript might assume the value always exists, causing type errors later or runtime crashes if it's undefined.
- **Fix:** Use `Readonly<Partial<Record<K, V>>>` when the dictionary may not contain all keys. Narrow the type carefully before rendering or passing to child components.
- **Example:**
  ```typescript
  // Allows typescript to know that `classes[day]` could be undefined
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  ```

## 7. React Compiler and `watch()` (`react-hooks/incompatible-library`)
- **Error:** The React Compiler (React 19+) flags `methods.watch()` from `react-hook-form` because it returns functions that cannot be safely memoized, potentially leading to stale UI or skipping compiler optimizations.
- **Fix:** Use the `useWatch` hook instead of `methods.watch()` for tracking form field changes.
- **Example:**
  ```tsx
  // BAD
  const selectedStatus = methods.watch("status");

  // GOOD
  const selectedStatus = useWatch({
    control: methods.control,
    name: "status",
    defaultValue: "regular",
  });
  ```

## 8. Emotion RTL + stylis `prefixer` + `::placeholder`
- **Error:** `TypeError: Cannot read properties of undefined (reading 'push')` during Emotion style insert (often blamed on `TextField` / `LoginForm`). Stack includes `stylis` `append` / `prefixer`.
- **Cause:** RTL Emotion caches that pass stylis’s `prefixer` alongside `stylis-plugin-rtl`, especially when app `stylis` ≠ `@emotion/cache`’s nested `4.2.0`. Prefixer expands `::placeholder` via `append()` and crashes.
- **Fix:** RTL `stylisPlugins: [rtlPlugin]` only — never import stylis `prefixer`. Keep `stylis@4.2.0`. Avoid `::placeholder` in `sx`/`styled` when possible.
- **Canonical doc:** [`docs/frontend/emotion-rtl-stylis.md`](../docs/frontend/emotion-rtl-stylis.md)

## 9. Soft-delete via `updateInstanceState` must allow `deletedAt`
- **Error:** GraphQL `deleteClassInstance` returned `success: true`, but booking still failed with "Teacher is already booked at this time."
- **Cause:** H7 mass-assignment whitelist in `updateInstanceState` omitted `deletedAt`. `SchedulingRepository.softDeleteClassInstance` passed `{ deletedAt }` which was stripped — only `updatedAt` changed.
- **Fix:** Include `"deletedAt"` in `ALLOWED_STATE_KEYS` in `backend/db/repo/scheduling/state-changes.ts`.
- **Test note:** Apollo Client v4 + `errorPolicy: "all"` surfaces failures on `.error`, not `.errors`.

