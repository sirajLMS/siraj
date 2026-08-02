# react-hook-form + zod + @hookform/resolvers — Node Module Research

## Package Overview

| Package | Version | Import Path | Module System |
|---------|---------|-------------|---------------|
| react-hook-form | 7.83.0 | `react-hook-form` | CJS + ESM |
| zod | 4.4.3 | `zod` (v4), `zod/v4` (explicit v4) | ESM (CJS via .cts) |
| @hookform/resolvers | 5.5.7 | `@hookform/resolvers/zod` | CJS + ESM |

- **react-hook-form**: `import { useForm, Controller } from 'react-hook-form'`
- **zod**: `import { z } from 'zod'` (auto-resolves to v4) or `import { z } from 'zod/v4'`
- **@hookform/resolvers/zod**: `import { zodResolver } from '@hookform/resolvers/zod'`
- All packages already installed in project (see package.json)

## Installation

Already installed:
```bash
bun add react-hook-form zod @hookform/resolvers
```

---

# React-Hook-Form v7.83.0 — TypeScript Type Research

Source: `node_modules/react-hook-form/dist/` type declarations.

---

## 1. useForm Signature

```typescript
export declare function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
>(
  props?: UseFormProps<TFieldValues, TContext, TTransformedValues>
): UseFormReturn<TFieldValues, TContext, TTransformedValues>;
```

### Generic Type Parameters

| Param | Constraint | Default | Purpose |
|-------|-----------|---------|---------|
| `TFieldValues` | `extends FieldValues` | `FieldValues` | Shape of form field values |
| `TContext` | (none) | `any` | Context passed to resolver |
| `TTransformedValues` | (none) | `TFieldValues` | Values after resolver transformation (e.g. Zod) |

---

## 2. UseFormProps

```typescript
export type UseFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
> = Partial<{
  mode: Mode;
  disabled: boolean;
  reValidateMode: Exclude<Mode, 'onTouched' | 'all'>;
  defaultValues: DefaultValues<TFieldValues> | AsyncDefaultValues<TFieldValues>;
  values: TFieldValues;
  errors: FieldErrors<TFieldValues>;
  resetOptions: Parameters<UseFormReset<TFieldValues>>[1];
  resolver: Resolver<TFieldValues, TContext, TTransformedValues>;
  context: TContext;
  shouldFocusError: boolean;
  shouldUnregister: boolean;
  shouldUseNativeValidation: boolean;
  progressive: boolean;
  criteriaMode: CriteriaMode;
  delayError: number;
  formControl?: Omit<UseFormReturn<TFieldValues, TContext, TTransformedValues>, 'formState'>;
  validate: ValidateForm<TFieldValues>;
}>;
```

### DefaultValues & AsyncDefaultValues

```typescript
type AsyncDefaultValues<TFieldValues> = (payload?: unknown) => Promise<TFieldValues>;
export type DefaultValues<TFieldValues> =
  TFieldValues extends AsyncDefaultValues<TFieldValues>
    ? DeepPartial<Awaited<TFieldValues>>
    : DeepPartial<TFieldValues>;
```

---

## 3. UseFormReturn

```typescript
export type UseFormReturn<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
> = {
  watch: UseFormWatch<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  getFieldState: UseFormGetFieldState<TFieldValues>;
  setError: UseFormSetError<TFieldValues>;
  clearErrors: UseFormClearErrors<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  setValues: UseFormSetValues<TFieldValues>;
  trigger: UseFormTrigger<TFieldValues>;
  formState: FormState<TFieldValues>;
  resetField: UseFormResetField<TFieldValues>;
  reset: UseFormReset<TFieldValues>;
  resetDefaultValues: UseFormResetDefaultValues<TFieldValues>;
  handleSubmit: UseFormHandleSubmit<TFieldValues, TTransformedValues>;
  unregister: UseFormUnregister<TFieldValues>;
  control: Control<TFieldValues, TContext, TTransformedValues>;
  register: UseFormRegister<TFieldValues>;
  setFocus: UseFormSetFocus<TFieldValues>;
  subscribe: UseFormSubscribe<TFieldValues>;
};
```

### Method Signatures

```typescript
// register
export type UseFormRegister<TFieldValues extends FieldValues> = <
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(name: TFieldName, options?: RegisterOptions<TFieldValues, TFieldName>)
  => UseFormRegisterReturn<TFieldName>;

// handleSubmit
export type UseFormHandleSubmit<
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues
> = (
  onValid: SubmitHandler<TTransformedValues>,
  onInvalid?: SubmitErrorHandler<TFieldValues>
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

// watch — overloaded
export type UseFormWatch<TFieldValues extends FieldValues> = {
  (): TFieldValues;
  <TFieldNames extends readonly FieldPath<TFieldValues>[]>(
    names: readonly [...TFieldNames], defaultValue?: DeepPartial<TFieldValues>
  ): FieldPathValues<TFieldValues, TFieldNames>;
  <TFieldName extends FieldPath<TFieldValues>>(
    name: TFieldName, defaultValue?: FieldPathValue<TFieldValues, TFieldName>
  ): FieldPathValue<TFieldValues, TFieldName>;
  (callback: WatchObserver<TFieldValues>, defaultValue?: DeepPartial<TFieldValues>): Subscription;
};

// getValues — overloaded
export type UseFormGetValues<TFieldValues extends FieldValues> = {
  (name?: undefined, config?: GetValuesConfig): TFieldValues;
  <TFieldName extends FieldPath<TFieldValues>>(name: TFieldName, config?: GetValuesConfig): FieldPathValue<TFieldValues, TFieldName>;
  <TFieldNames extends FieldPath<TFieldValues>[]>(names: readonly [...TFieldNames], config?: GetValuesConfig): [...FieldPathValues<TFieldValues, TFieldNames>];
};

// setValue
export type UseFormSetValue<TFieldValues extends FieldValues> = <
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(name: TFieldName, value: FieldPathValue<TFieldValues, TFieldName>, options?: SetValueConfig) => void;

// setValues
export type UseFormSetValues<TFieldValues extends FieldValues> = (
  value: Partial<TFieldValues> | ResetAction<TFieldValues>, options?: SetValueConfig
) => void;

// trigger
export type UseFormTrigger<TFieldValues extends FieldValues> = (
  name?: FieldPath<TFieldValues> | FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[],
  options?: TriggerConfig
) => Promise<boolean>;

// reset
export type UseFormReset<TFieldValues extends FieldValues> = (
  values?: DefaultValues<TFieldValues> | TFieldValues | ResetAction<TFieldValues>,
  keepStateOptions?: KeepStateOptions
) => void;

// resetField
export type UseFormResetField<TFieldValues extends FieldValues> = <
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(name: TFieldName, options?: ResetFieldConfig<TFieldValues, TFieldName>) => void;

// resetDefaultValues
export type UseFormResetDefaultValues<TFieldValues extends FieldValues> = (
  values: DefaultValues<TFieldValues> | TFieldValues,
  options?: Partial<Pick<KeepStateOptions, 'keepDirty' | 'keepIsValid'>>
) => void;

// clearErrors
export type UseFormClearErrors<TFieldValues extends FieldValues> = (
  name?: FieldPath<TFieldValues> | FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[]
        | `root.${string}` | 'root' | 'form' | `form.${string}`
) => void;

// setError
export type UseFormSetError<TFieldValues extends FieldValues> = (
  name: FieldPath<TFieldValues> | `root.${string}` | 'root' | 'form' | `form.${string}`,
  error: ErrorOption,
  options?: { shouldFocus: boolean }
) => void;

// setFocus
export type UseFormSetFocus<TFieldValues extends FieldValues> = <
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(name: TFieldName, options?: SetFocusOptions) => void;

// getFieldState
export type UseFormGetFieldState<TFieldValues extends FieldValues> = <
  TFieldName extends FieldPath<TFieldValues>
>(name: TFieldName, formState?: FormState<TFieldValues>) => {
  invalid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  error?: FieldError;
};

// subscribe
export type UseFormSubscribe<TFieldValues extends FieldValues> = <
  TFieldNames extends readonly FieldPath<TFieldValues>[]
>(payload: {
  name?: readonly [...TFieldNames] | TFieldNames[number];
  formState?: Partial<ReadFormState>;
  callback: (data: Partial<FormState<TFieldValues>> & {
    values: TFieldValues;
    name?: InternalFieldName;
    type?: EventType;
  }) => void;
  exact?: boolean;
}) => () => void;
```

### Config / Options Types

```typescript
export type SetValueConfig = Partial<{
  shouldValidate: boolean;
  shouldDirty: boolean;
  shouldTouch: boolean;
  delayError: boolean;
}>;

export type TriggerConfig = Partial<{ shouldFocus: boolean }>;

export type ResetFieldConfig<TFieldValues extends FieldValues, TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = Partial<{
  keepDirty: boolean;
  keepTouched: boolean;
  keepError: boolean;
  defaultValue: FieldPathValue<TFieldValues, TFieldName>;
}>;

export type GetValuesConfig = EitherOption<{ dirtyFields: boolean; touchedFields: boolean }>;

export type SetFocusOptions = Partial<{ shouldSelect: boolean }>;

export type KeepStateOptions = Partial<{
  keepDirtyValues: boolean;
  keepErrors: boolean;
  keepDirty: boolean;
  keepValues: boolean;
  keepDefaultValues: boolean;
  keepIsSubmitted: boolean;
  keepIsSubmitSuccessful: boolean;
  keepTouched: boolean;
  keepIsValidating: boolean;
  keepIsValid: boolean;
  keepSubmitCount: boolean;
  keepFieldsRef: boolean;
}>;
```

---

## 4. FormState

```typescript
export type FormState<TFieldValues extends FieldValues> = {
  isDirty: boolean;
  isLoading: boolean;
  isSubmitted: boolean;
  isSubmitSuccessful: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  disabled: boolean;
  submitCount: number;
  defaultValues?: undefined | Readonly<DeepPartial<TFieldValues>>;
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<TFieldValues>>>;
  touchedFields: Partial<Readonly<FieldNamesMarkedBoolean<TFieldValues>>>;
  validatingFields: Partial<Readonly<FieldNamesMarkedBoolean<TFieldValues>>>;
  errors: FieldErrors<TFieldValues>;
  isReady: boolean;
};
```

### FormStateProxy & ReadFormState

```typescript
export type FormStateProxy<TFieldValues extends FieldValues = FieldValues> = {
  isDirty: boolean;
  isValidating: boolean;
  dirtyFields: FieldNamesMarkedBoolean<TFieldValues>;
  touchedFields: FieldNamesMarkedBoolean<TFieldValues>;
  validatingFields: FieldNamesMarkedBoolean<TFieldValues>;
  errors: boolean;
  isValid: boolean;
};

export type ReadFormState = {
  [K in keyof FormStateProxy]: boolean | 'all';
} & {
  values?: boolean;
  defaultValues?: boolean | 'all';
  isSubmitted?: boolean | 'all';
  submitCount?: boolean | 'all';
};
```

---

## 5. FieldErrors & Error Types

```typescript
export type Message = string;

export type MultipleFieldErrors = {
  [K in keyof RegisterOptions]?: ValidateResult;
} & { [key: string]: ValidateResult };

export type FieldError = {
  type: LiteralUnion<keyof RegisterOptions, string>;
  root?: FieldError;
  ref?: Ref;
  types?: MultipleFieldErrors;
  message?: Message;
};

export type ErrorOption = {
  message?: Message;
  type?: LiteralUnion<keyof RegisterOptions, string>;
  types?: MultipleFieldErrors;
};

export type GlobalError = Partial<{ type: string | number; message: Message }>;

export type FieldErrorsImpl<T extends FieldValues = FieldValues> = {
  [K in keyof T]?: T[K] extends BrowserNativeObject | Blob
    ? FieldError
    : K extends 'root' | `root.${string}` ? GlobalError
    : T[K] extends object ? Merge<FieldError, FieldErrorsImpl<T[K]>> : FieldError;
};

export type FieldErrors<T extends FieldValues = FieldValues> =
  Partial<FieldErrorsImpl<DeepRequired<T>>> & {
    root?: Record<string, GlobalError> & GlobalError;
    form?: GlobalError;
  };
```

---

## 6. Resolver, SubmitHandler, SubmitErrorHandler

```typescript
// SubmitHandler
export type SubmitHandler<T> = (
  data: T, event?: React.BaseSyntheticEvent
) => unknown | Promise<unknown>;

// FormSubmitHandler (for Form component)
export type FormSubmitHandler<TTransformedValues> = (payload: {
  data: TTransformedValues;
  event?: React.BaseSyntheticEvent;
  formData: FormData;
  formDataJson: string;
  method?: 'post' | 'put' | 'delete';
}) => unknown | Promise<unknown>;

// SubmitErrorHandler
export type SubmitErrorHandler<TFieldValues extends FieldValues> = (
  errors: FieldErrors<TFieldValues>, event?: React.BaseSyntheticEvent
) => unknown | Promise<unknown>;

// Resolver
export type Resolver<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
> = (
  values: TFieldValues,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>
) => Promise<ResolverResult<TFieldValues, TTransformedValues>>
  | ResolverResult<TFieldValues, TTransformedValues>;

export interface ResolverOptions<TFieldValues extends FieldValues> {
  criteriaMode?: CriteriaMode;
  fields: Record<InternalFieldName, Field['_f']>;
  names?: FieldName<TFieldValues>[];
  shouldUseNativeValidation: boolean | undefined;
}

export type ResolverResult<TFieldValues extends FieldValues = FieldValues, TTransformedValues = TFieldValues> =
  | { values: TTransformedValues; errors: Record<string, never> }
  | { values: Record<string, never>; errors: FieldErrors<TFieldValues> };
```

---

## 7. ValidationMode & CriteriaMode

```typescript
// constants.d.ts
export declare const VALIDATION_MODE: {
  readonly onBlur: "onBlur";
  readonly onChange: "onChange";
  readonly onSubmit: "onSubmit";
  readonly onTouched: "onTouched";
  readonly all: "all";
};

export type ValidationMode = typeof VALIDATION_MODE;
export type Mode = keyof ValidationMode; // 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all'

export type ValidationModeFlags = {
  isOnSubmit: boolean;
  isOnBlur: boolean;
  isOnChange: boolean;
  isOnAll: boolean;
  isOnTouch: boolean;
};

export type CriteriaMode = 'firstError' | 'all';
```

---

## 8. RegisterOptions (Validation Rules)

```typescript
export type RegisterOptions<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Partial<{
  required: Message | ValidationRule<boolean>;
  min: ValidationRule<number | string>;
  max: ValidationRule<number | string>;
  maxLength: ValidationRule<number>;
  minLength: ValidationRule<number>;
  validate: Validate<FieldPathValue<TFieldValues, TFieldName>, TFieldValues>
           | Record<string, Validate<FieldPathValue<TFieldValues, TFieldName>, TFieldValues>>;
  value: FieldPathValue<TFieldValues, TFieldName>;
  setValueAs: (value: any) => any;
  shouldUnregister?: boolean;
  onChange?: (event: any) => void;
  onBlur?: (event: any) => void;
  disabled: boolean;
  deps: FieldPath<TFieldValues> | FieldPath<TFieldValues>[];
}> & (
  | { pattern?: ValidationRule<RegExp>; valueAsNumber?: false; valueAsDate?: false; }
  | { pattern?: undefined; valueAsNumber?: false; valueAsDate?: true; }
  | { pattern?: undefined; valueAsNumber?: true;  valueAsDate?: false; }
);

export type ValidationValue = boolean | number | string | RegExp;
export type ValidationRule<TValidationValue extends ValidationValue = ValidationValue> =
  TValidationValue | ValidationValueMessage<TValidationValue>;
export type ValidationValueMessage<TValidationValue extends ValidationValue = ValidationValue> = {
  value: TValidationValue | undefined;
  message: Message;
};
export type ValidateResult = Message | Message[] | boolean | undefined;
export type Validate<TFieldValue, TFormValues> = (
  value: TFieldValue, formValues: TFormValues
) => ValidateResult | Promise<ValidateResult>;
```

---

## 9. UseControllerReturn & UseControllerProps

```typescript
export type UseControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues
> = {
  name: TName;
  rules?: Omit<RegisterOptions<TFieldValues, TName>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
  shouldUnregister?: boolean;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
};

export type UseControllerReturn<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  formState: UseFormStateReturn<TFieldValues>;
  fieldState: ControllerFieldState;
};

export type ControllerRenderProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  onChange: (...event: any[]) => void;
  onBlur: Noop;
  value: FieldPathValue<TFieldValues, TName>;
  disabled?: boolean;
  name: TName;
  ref: RefCallBack;
};

export type ControllerFieldState = {
  invalid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  error?: FieldError;
};
```

### useController Hook Signature

```typescript
export declare function useController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues
>(props: UseControllerProps<TFieldValues, TName, TTransformedValues>): UseControllerReturn<TFieldValues, TName>;
```

---

## 10. ControllerProps (Component)

```typescript
export type ControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues
> = {
  render: ({ field, fieldState, formState }: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TFieldValues>;
  }) => React.ReactElement;
} & UseControllerProps<TFieldValues, TName, TTransformedValues>;

// Controller component
declare const Controller: <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues
>(props: ControllerProps<TFieldValues, TName, TTransformedValues>)
  => import("react").ReactElement;
```

---

## 11. UseFieldArrayReturn & UseFieldArrayProps

```typescript
export type UseFieldArrayProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
  TTransformedValues = TFieldValues
> = {
  name: TFieldArrayName;
  keyName?: TKeyName;
  control?: Control<TFieldValues, any, TTransformedValues>;
  rules?: {
    validate?: Validate<FieldArray<TFieldValues, TFieldArrayName>[], TFieldValues>
           | Record<string, Validate<FieldArray<TFieldValues, TFieldArrayName>[], TFieldValues>>;
  } & Pick<RegisterOptions<TFieldValues>, 'maxLength' | 'minLength' | 'required'>;
  shouldUnregister?: boolean;
  disabled?: boolean;
};

export type UseFieldArrayReturn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
> = {
  swap: UseFieldArraySwap;
  move: UseFieldArrayMove;
  prepend: UseFieldArrayPrepend<TFieldValues, TFieldArrayName>;
  append: UseFieldArrayAppend<TFieldValues, TFieldArrayName>;
  remove: UseFieldArrayRemove;
  insert: UseFieldArrayInsert<TFieldValues, TFieldArrayName>;
  update: UseFieldArrayUpdate<TFieldValues, TFieldArrayName>;
  replace: UseFieldArrayReplace<TFieldValues, TFieldArrayName>;
  fields: (FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName> & {
    disabled?: boolean;
  })[];
};
```

### FieldArray Method Types

```typescript
export type UseFieldArraySwap = (indexA: number, indexB: number) => void;
export type UseFieldArrayMove = (indexA: number, indexB: number) => void;
export type UseFieldArrayPrepend<T, N> = (value: FieldArray<T,N> | FieldArray<T,N>[], options?: FieldArrayMethodProps) => void;
export type UseFieldArrayAppend<T, N>  = (value: FieldArray<T,N> | FieldArray<T,N>[], options?: FieldArrayMethodProps) => void;
export type UseFieldArrayRemove = (index?: number | number[]) => void;
export type UseFieldArrayInsert<T, N> = (index: number, value: FieldArray<T,N> | FieldArray<T,N>[], options?: FieldArrayMethodProps) => void;
export type UseFieldArrayUpdate<T, N> = (index: number, value: FieldArray<T,N>) => void;
export type UseFieldArrayReplace<T, N> = (value: FieldArray<T,N> | FieldArray<T,N>[]) => void;
export type FieldArrayMethodProps = { shouldFocus?: boolean; focusIndex?: number; focusName?: string; };
export type FieldArrayWithId<T, N, K extends string = 'id'> = FieldArray<T, N> & Record<K, string>;
```

### useFieldArray Hook Signature

```typescript
export declare function useFieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
  TTransformedValues = TFieldValues
>(props: UseFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName, TTransformedValues>)
  : UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName>;
```

---

## 12. FormProviderProps & Form Component

```typescript
export type FormProviderProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
> = { children: React.ReactNode | React.ReactNode[] }
  & UseFormReturn<TFieldValues, TContext, TTransformedValues>;

// FormProvider component
export declare const FormProvider: <
  TFieldValues extends FieldValues, TContext = any, TTransformedValues = TFieldValues
>(props: FormProviderProps<TFieldValues, TContext, TTransformedValues>) => React.JSX.Element;

// Form component
export type FormProps<
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues
> = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onError' | 'onSubmit'> & Partial<{
  control: Control<TFieldValues, any, TTransformedValues>;
  headers: Record<string, string>;
  validateStatus: (status: number) => boolean;
  onError: ({ response, error }: { response: Response; error?: undefined } | { response?: undefined; error: unknown }) => void;
  onSuccess: ({ response }: { response: Response }) => void;
  onSubmit: FormSubmitHandler<TTransformedValues>;
  method: 'post' | 'put' | 'delete';
  children: React.ReactNode | React.ReactNode[];
  render: (props: { submit: (e?: React.FormEvent) => void }) => React.ReactNode | React.ReactNode[];
  encType: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain' | 'application/json';
}>;

declare function Form<TFieldValues extends FieldValues, TTransformedValues = TFieldValues>(
  props: FormProps<TFieldValues, TTransformedValues>
): React.JSX.Element;
```

---

## 13. useFormContext & useFormState

```typescript
// useFormContext
export declare const useFormContext: <
  TFieldValues extends FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
>() => UseFormReturn<TFieldValues, TContext, TTransformedValues>;

// useFormState
export type UseFormStateProps<TFieldValues extends FieldValues, TTransformedValues = TFieldValues> = Partial<{
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  name?: FieldPath<TFieldValues> | FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[];
  exact?: boolean;
}>;
export type UseFormStateReturn<TFieldValues extends FieldValues> = FormState<TFieldValues>;

export declare function useFormState<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues = TFieldValues
>(props?: UseFormStateProps<TFieldValues, TTransformedValues>): UseFormStateReturn<TFieldValues>;
```

---

## 14. useWatch (7 Overloads)

```typescript
// 1. No name — returns all values
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TTransformedValues = TFieldValues>(props: {
  name?: undefined;
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute?: undefined;
}): DeepPartialSkipArrayKey<TFieldValues>;

// 2. Single field name
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>, TTransformedValues = TFieldValues>(props: {
  name: TFieldName;
  defaultValue?: FieldPathValue<TFieldValues, TFieldName>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute?: undefined;
}): FieldPathValue<TFieldValues, TFieldName>;

// 3. Compute function (all values)
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TTransformedValues = TFieldValues, TComputeValue = unknown>(props: {
  name?: undefined;
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute: (formValues: TFieldValues) => TComputeValue;
}): TComputeValue;

// 4. Compute function (single field)
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>, TTransformedValues = TFieldValues, TComputeValue = unknown>(props: {
  name: TFieldName;
  defaultValue?: FieldPathValue<TFieldValues, TFieldName>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute: (fieldValue: FieldPathValue<TFieldValues, TFieldName>) => TComputeValue;
}): TComputeValue;

// 5. Array of field names
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TFieldNames extends readonly FieldPath<TFieldValues>[] = readonly FieldPath<TFieldValues>[], TTransformedValues = TFieldValues>(props: {
  name: readonly [...TFieldNames];
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute?: undefined;
}): FieldPathValues<TFieldValues, TFieldNames>;

// 6. Array of names with compute
export declare function useWatch<TFieldValues extends FieldValues = FieldValues, TFieldNames extends readonly FieldPath<TFieldValues>[] = readonly FieldPath<TFieldValues>[], TTransformedValues = TFieldValues, TComputeValue = unknown>(props: {
  name: readonly [...TFieldNames];
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>;
  control?: Control<TFieldValues, any, TTransformedValues>;
  disabled?: boolean;
  exact?: boolean;
  compute: (fieldValue: FieldPathValues<TFieldValues, TFieldNames>) => TComputeValue;
}): TComputeValue;

// 7. No props — uses context
export declare function useWatch<TFieldValues extends FieldValues = FieldValues>(): DeepPartialSkipArrayKey<TFieldValues>;
```

---

## 15. Control Type (Internal)

```typescript
export type Control<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues
> = {
  _subjects: Subjects<TFieldValues>;
  _removeUnmounted: Noop;
  _names: Names;
  _state: { mount: boolean; action: boolean; watch: boolean; };
  _reset: UseFormReset<TFieldValues>;
  _options: UseFormProps<TFieldValues, TContext, TTransformedValues>;
  _getDirty: GetIsDirty;
  _resetDefaultValues: Noop;
  _formState: FormState<TFieldValues>;
  _setValid: (shouldUpdateValid?: boolean) => void;
  _fields: FieldRefs;
  _formValues: FieldValues;
  _proxyFormState: ReadFormState;
  _defaultValues: Partial<DefaultValues<TFieldValues>>;
  _getWatch: WatchInternal<TFieldValues>;
  _setFieldArray: BatchFieldArrayUpdate;
  _getFieldArray: <TFieldArrayValues>(name: InternalFieldName) => Partial<TFieldArrayValues>[];
  _setErrors: (errors: FieldErrors<TFieldValues>) => void;
  _setDisabledField: (props: { disabled?: boolean; name: FieldName<any>; }) => void;
  _runSchema: (names: InternalFieldName[]) => Promise<{ errors: FieldErrors; }>;
  _updateIsValidating: (names?: InternalFieldName[], isValidating?: boolean) => void;
  _focusError: () => boolean | undefined;
  _disableForm: (disabled?: boolean) => void;
  _subscribe: FromSubscribe<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  handleSubmit: UseFormHandleSubmit<TFieldValues, TTransformedValues>;
  unregister: UseFormUnregister<TFieldValues>;
  getFieldState: UseFormGetFieldState<TFieldValues>;
  setError: UseFormSetError<TFieldValues>;
};
```

---

## 16. Deprecated APIs

Two `@deprecated` tags found in v7.83.0 type declarations:

1. **`NestedValue<TValue>`** (`types/form.d.ts` line 14):
   ```typescript
   /** @deprecated to be removed in the next major version */
   export type NestedValue<TValue extends object = object> = { [$NestedValue]: never; } & TValue;
   ```

2. **`WatchProps.names`** (`types/watch.d.ts` line 21):
   ```typescript
   /**
    * @deprecated This prop will be renamed to `name` in the next major release.
    * Use `name` instead.
    */
   names?: TFieldName;
   ```

---

## 17. Key Utility Types

```typescript
export type FieldValues = Record<string, any>;
export type InternalFieldName = string;
export type FieldPath<TFieldValues extends FieldValues> = Path<TFieldValues>;
export type FieldPathValue<TFieldValues, TFieldPath extends FieldPath<TFieldValues>> = PathValue<TFieldValues, TFieldPath>;
export type FieldArrayPath<TFieldValues extends FieldValues> = ArrayPath<TFieldValues>;
export type FieldPathValues<TFieldValues, TPath extends FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[]> = {
  [K in keyof TPath]: FieldPathValue<TFieldValues, TPath[K] & FieldPath<TFieldValues>>;
};
export type DeepPartial<T> = IsPrimitiveLike<T> extends true ? T : T extends BrowserNativeObject | NestedValue ? T : { [K in keyof T]?: DeepPartial<T[K]>; };
export type DeepPartialSkipArrayKey<T> = T extends ReadonlyArray<any> ? { [K in keyof T]: DeepPartialSkipArrayKey<T[K]>; } : { [K in keyof T]?: DeepPartialSkipArrayKey<T[K]>; };
export type Noop = () => void;
export type RefCallBack = (instance: any) => void;
export type WatchObserver<TFieldValues extends FieldValues> = (value: DeepPartialSkipArrayKey<TFieldValues>, info: { name?: FieldPath<TFieldValues>; type?: EventType; values?: unknown; }) => void;
```
# Zod v4.4.3 API Research

Source: `node_modules/zod/` (v4.4.3), `v4/classic/` layer.

## Base ZodType (all schemas inherit)

```ts
interface ZodType<Output, Input, Internals> extends core.$ZodType {
  def; type; "~standard": ZodStandardSchemaWithJSON<this>;
  toJSONSchema(params?): ZodStandardJSONSchemaPayload<this>;
  check(...checks): this;  with(...checks): this;  // alias
  clone(def?, params?): this;
  register<R>(registry, ...meta): this;
  brand<T, Dir="out"|"in"|"inout">(): $ZodBranded<this, T, Dir>;
  // Parsing (instance)
  parse(data, params?): output<this>;
  safeParse(data, params?): ZodSafeParseResult<output<this>>;
  parseAsync/safeParseAsync/safeEncode/safeDecode/safeEncodeAsync/safeDecodeAsync(...)
  spa = safeParseAsync;  encode/decode/encodeAsync/decodeAsync(...)
  // Refinement & transformation
  refine<Ch>(check, params?): this | narrowed;  // type guards narrow `this`
  superRefine(refinement, params?): this;
  overwrite(fn: (x) => x): this;
  transform<NewOut>(fn): ZodPipe<this, ZodTransform<Awaited<NewOut>>>;
  pipe<T>(target): ZodPipe<this, T>;
  // Wrappers
  optional(): ZodOptional<this>;       exactOptional(): ZodExactOptional<this>;
  nonoptional(params?): ZodNonOptional<this>;
  nullable(): ZodNullable<this>;        nullish(): ZodOptional<ZodNullable<this>>;
  default(def | (() => def)): ZodDefault<this>;
  prefault(def | (() => def)): ZodPrefault<this>;
  array(): ZodArray<this>;
  or<T>(option): ZodUnion<[this, T]>;   and<T>(incoming): ZodIntersection<this, T>;
  catch(def | ((ctx) => def)): ZodCatch<this>;
  readonly(): ZodReadonly<this>;
  describe(description): this;          meta(data?): GlobalMeta | this;
  apply<T>(fn): T;
  // @deprecated
  _def; _output; _input;
  isOptional(): boolean;  // → safeParse(undefined).success
  isNullable(): boolean;  // → safeParse(null).success
}
```

## 1. String Schema: `z.string()`

```ts
function string(params?): ZodString;  // also string<T extends string>()

interface ZodString {
  format: string | null;
  minLength, maxLength: number | null;
  regex(regex, params?): this;
  includes(value, params?): this;
  startsWith(value, params?): this;
  endsWith(value, params?): this;
  min(minLength, params?): this;
  max(maxLength, params?): this;
  length(len, params?): this;
  nonempty(params?): this;
  lowercase/uppercase(params?): this;  // case checks (validate is already lowercase)
  trim(): this;
  normalize(form?: "NFC"|"NFD"|"NFKC"|"NFKD"): this;
  toLowerCase/toUpperCase(): this;  // transforms
  slugify(): this;
}
```

#### Format methods on ZodString (ALL @deprecated — use standalone builders):

```
.email()/.url()/.jwt()/.emoji()/.guid()/.uuid()/.uuidv4()/.uuidv6()/.uuidv7()
.nanoid()/.cuid()/.cuid2()/.ulid()/.base64()/.base64url()/.xid()/.ksuid()
.ipv4()/.ipv6()/.cidrv4()/.cidrv6()/.e164()
.datetime()/.date()/.time()/.duration()
```

### Standalone string-format builders (v4 preferred; `params?: string | $ZodXxxParams`)

```
z.email(), z.guid(), z.uuid(), z.uuidv4(), z.uuidv6(), z.uuidv7(),
z.url(), z.httpUrl(), z.emoji(), z.nanoid(),
z.cuid() (@deprecated → cuid2), z.cuid2(), z.ulid(), z.xid(), z.ksuid(),
z.ipv4(), z.ipv6(), z.mac(), z.cidrv4(), z.cidrv6(),
z.base64(), z.base64url(), z.e164(), z.jwt(),
z.stringFormat(format, fnOrRegex, params?)  // custom string format
z.hostname(), z.hex(),
z.hash<Alg, Enc="hex">(alg, { enc }?): ZodCustomStringFormat<`${Alg}_${Enc}`>
```

## 2. Number Schema: `z.number()`

```ts
function number(params?): ZodNumber;

interface ZodNumber {
  gt(value, params?): this;        // strictly >
  gte(value, params?): this;        // alias of .min()
  min(value, params?): this;
  lt(value, params?): this;
  lte(value, params?): this;       // alias of .max()
  max(value, params?): this;
  int(params?): this;               // "legacy" — prefer z.int()
  safe(params?): this;              // @deprecated — identical to .int()
  positive(params?): this;
  nonnegative(params?): this;
  negative(params?): this;
  nonpositive(params?): this;
  multipleOf(value, params?): this;
  step(value, params?): this;       // @deprecated → .multipleOf()
  finite(params?): this;            // @deprecated — no-op (infinity not allowed)
  minValue, maxValue: number | null;
  format: string | null;
  isInt: boolean;                   // @deprecated → check format
  isFinite: boolean;                 // @deprecated → always true
}
```

### Number format variants

```
z.int(), z.float32(), z.float64(), z.int32(), z.uint32(),
z.int64(), z.uint64()  // bigint-based (ZodBigIntFormat)
```

## 3a. Boolean, Date, BigInt, Symbol, ISO

```ts
z.boolean(params?)               // no extra validators
z.symbol(params?)                // no extra validators
z.date(params?): ZodDate         // .min(value|Date), .max(value|Date); deprecated: minDate, maxDate
z.bigint(params?): ZodBigInt      // gte/min/gt/lte/max/lt(positive: nonnegative/negative/nonpositive); multipleOf(value); format
z.iso.datetime(), z.iso.date(), z.iso.time(), z.iso.duration()  // standalone classes: ZodISODateTime/Date/Time/Duration
```

## 4. Array: `z.array()`

```ts
function array<T>(element, params?): ZodArray<T>;
interface ZodArray<T> {
  element: T;
  min(minLength, params?): this;
  max(maxLength, params?): this;
  length(len, params?): this;
  nonempty(params?): this;
  unwrap(): T;
}
```

## 5. Object: `z.object()`

```ts
function object<T extends $ZodLooseShape>(shape?, params?): ZodObject<Writeable<T>, $strip>;
function strictObject<T>(shape, params?): ZodObject<..., $strict>;
function looseObject<T>(shape, params?): ZodObject<..., $loose>;

interface ZodObject<Shape, Config> {
  shape: Shape;
  keyof(): ZodEnum<ToEnum<keyof Shape & string>>;
  catchall<T>(schema): ZodObject<Shape, $catchall<T>>;
  passthrough(): ZodObject<Shape, $loose>;  // @deprecated → z.looseObject()/.loose()
  loose(): ZodObject<Shape, $loose>;
  strict(): ZodObject<Shape, $strict>;
  strip(): ZodObject<Shape, $strip>;  // default
  extend<U extends $ZodLooseShape>(shape): ZodObject<Extend<Shape, U>, Config>;
  safeExtend<U>(shape): ZodObject<...>;  // type-safe extend
  merge<U extends ZodObject>(other): ZodObject<...>;  // @deprecated → A.extend(B.shape)
  pick<M>(mask): ZodObject<Pick<Shape, M>, Config>;
  omit<M>(mask): ZodObject<Omit<Shape, M>, Config>;
  partial(): ZodObject<{ [k]: ZodOptional<Shape[k]> }, Config>;
  partial<M>(mask): ZodObject<{ selected optional }, Config>;
  required(): ZodObject<{ [k]: ZodNonOptional<Shape[k]> }, Config>;
  required<M>(mask): ZodObject<{ selected nonoptional }, Config>;
}

function keyof<T extends ZodObject>(schema): ZodEnum<KeysEnum<output<T>>>;
```

## 6. Composite Types

### Enum

```ts
function enum<T extends readonly string[]>(values, params?): ZodEnum<ToEnum<T>>;
function enum<T extends EnumLike>(entries, params?): ZodEnum<T>;  // accepts native TS enum
function nativeEnum<T extends EnumLike>(entries, params?): ZodEnum<T>;  // @deprecated → z.enum()

interface ZodEnum {
  enum: T;
  options: T[keyof T][];
  extract<U>(values, params?): ZodEnum<Pick<T, U>>;
  exclude<U>(values, params?): ZodEnum<Omit<T, U>>;
}
```

### Literal — supports multi-literal

```ts
function literal<T extends Literal>(value, params?): ZodLiteral<T>;
function literal<T extends ReadonlyArray<Literal>>(value, params?): ZodLiteral<T[number]>;
// z.literal(["a","b"]) → ZodLiteral<"a"|"b">

interface ZodLiteral {
  values: Set<T>;
  value: T;  // @legacy — use .values; throws if multi-valued
}
```

### Union, XOR, DiscriminatedUnion, Intersection

```ts
function union<T extends readonly $ZodType[]>(options, params?): ZodUnion<T>;
function xor<T extends readonly $ZodType[]>(options, params?): ZodXor<T>;
// XOR: exactly one must match (0 or >=2 → fail)
function discriminatedUnion<Types extends [Discriminable, ...], Disc extends string>(
  discriminator: Disc, options: Types, params?): ZodDiscriminatedUnion<Types, Disc>;
function intersection<T, U>(left, right): ZodIntersection<T, U>;
// Operator methods: a.or(b) → ZodUnion;  a.and(b) → ZodIntersection
```

### Record, Tuple, Map, Set, Promise, Lazy, Custom, InstanceOf, File, JSON, TemplateLiteral, NaN

```ts
function record<K extends $ZodRecordKey, V extends $ZodType>(keyType, valueType, params?): ZodRecord<K, V>;
function partialRecord<K, V>(keyType, valueType, params?): ZodRecord<K & $partial, V>;
function looseRecord<K, V>(keyType, valueType, params?): ZodRecord<K, V>;
interface ZodRecord { keyType: K; valueType: V; }

function tuple<T extends [$ZodType, ...]>(items, params?): ZodTuple<T, null>;
function tuple<T, Rest>(items, rest, params?): ZodTuple<T, Rest>;
function tuple(items: [], params?): ZodTuple<[], null>;
// ZodTuple.rest<Rest>(rest): ZodTuple<T, Rest>

function map<K, V>(keyType, valueType, params?): ZodMap<K, V>;
interface ZodMap { min/max/size/nonempty(...); keyType; valueType; }

function set<V>(valueType, params?): ZodSet<V>;
interface ZodSet { min/max/size/nonempty(...); }

function promise<T>(innerType): ZodPromise<T>;
function lazy<T>(getter: () => T): ZodLazy<T>;
function custom<O>(fn?, params?): ZodCustom<O, O>;
function instanceof<T extends Class>(cls, params?): ZodCustom<InstanceType<T>>;

function file(params?): ZodFile;
interface ZodFile { min(size); max(size); mime(types | types[]); }

function json(params?): ZodJSONSchema;  // union of string|num|bool|null|array|record
function templateLiteral<Parts>(parts, params?): ZodTemplateLiteral<PartsToTemplateLiteral<Parts>>;
function nan(params?): ZodNaN;

// z.function() — overloads
function function(): ZodFunction;
function function(params: { input } | { output } | { input, output }): ZodFunction;
// ZodFunction.input(...args).output(schema)
```

## 7. Optional / Nullable / Nullish / Primitives

```ts
function optional<T>(inner): ZodOptional<T>;
function exactOptional<T>(inner): ZodExactOptional<T>;
function nullable<T>(inner): ZodNullable<T>;
function nullish<T>(inner): ZodOptional<ZodNullable<T>>;
function nonoptional<T>(inner, params?): ZodNonOptional<T>;
function success<T>(inner): ZodSuccess<T>;
// All wrappers: .unwrap(): T

// Singletons
z.undefined()  // also: ZodUndefined      (params?)
z.null()       // also: ZodNull           (params?)
z.any()        // also: ZodAny            (NO params)
z.unknown()    // also: ZodUnknown         (NO params)
z.never(params?): ZodNever
z.void()       // also: ZodVoid            (params?)
```

## 8. Transform & Refinement Methods

### Instance methods on ZodType (see Base)

```
.refine(check, params?)         — type guard check narrows `this`
.superRefine(refinement, params?) — access RefinementCtx for custom issues
.transform<NewOut>(fn)           — pipe to ZodTransform<Awaited<NewOut>>
.pipe(target)                     — chain schemas (output-of-this ≈ input-of-target)
.overwrite(fn)                    — mutate value in place (no new output type)
.brand<T, Dir>()                  — nominal branding (in/out/inout direction)
.readonly()                        — ZodReadonly<this>
.describe(description)            — registers description in globalRegistry
.meta(data?)                       — get/set metadata in globalRegistry
```

### Standalone transform/refine exports

```ts
function transform<I, O>(fn: (input, ctx) => O): ZodTransform<Awaited<O>, I>;
function check<O>(fn: CheckFn<O>): $ZodCheck<O>;
function refine<T>(fn, params?): $ZodCheck<T>;
function superRefine<T>(fn, params?): $ZodCheck<T>;
function preprocess<A, U>(fn: (arg, ctx) => A, schema: U): ZodPreprocess<U>;
function readonly<T>(inner): ZodReadonly<T>;
const describe, meta;  // core.describe / core.meta
function pipe<A, B>(in_, out): ZodPipe<A, B>;
function codec<A, B>(in_, out, params: { decode, encode }): ZodCodec<A, B>;
function invertCodec<A, B>(codec): ZodCodec<B, A>;
function stringbool(params?): ZodCodec<ZodString, ZodBoolean>;
// z.preprocess retained as function name on ZodType (legacy)
```

### Default, Prefault, Catch

```ts
function default<T>(inner, defValue | (() => defValue)): ZodDefault<T>;
function prefault<T>(inner, defValue | (() => defValue)): ZodPrefault<T>;
function catch<T>(inner, catchValue | ((ctx) => catchValue)): ZodCatch<T>;
// .removeDefault()  @deprecated → .unwrap()
// .removeCatch()    @deprecated → .unwrap()
```

## 9. z.coerce namespace

```ts
namespace coerce {
  function string<T = unknown>(params?): ZodCoercedString<T>;
  function number<T = unknown>(params?): ZodCoercedNumber<T>;
  function boolean<T = unknown>(params?): ZodCoercedBoolean<T>;
  function bigint<T = unknown>(params?): ZodCoercedBigInt<T>;
  function date<T = unknown>(params?): ZodCoercedDate<T>;
}
// Each coerced variant has the same methods as its non-coerced sibling.
```

## 10. ZodRawShape

```ts
// compat.d.ts:
type ZodRawShape = core.$ZodShape;  // "Included for Zod 3 compatibility"
// No standalone z.rawShape() function in v4 — use schema.shape property instead.
```

## 11. ZodError / ZodIssue

```ts
// errors.d.ts
export type ZodIssue = core.$ZodIssue;  // @deprecated → z.core.$ZodIssue (for libraries)

export interface ZodError<T = unknown> extends $ZodError<T> {
  format(): $ZodFormattedError<T>;
  format<U>(mapper): $ZodFormattedError<T, U>;
  flatten(): $ZodFlattenedError<T>;        // @deprecated → z.flattenError()
  flatten<U>(mapper): $ZodFlattenedError<T, U>;
  addIssue(issue): void;                    // @deprecated → push .issues directly
  addIssues(issues): void;                   // @deprecated
  isEmpty: boolean;                          // @deprecated → .issues.length === 0
}
export const ZodError: $constructor<ZodError>;
export const ZodRealError: $constructor<ZodError>;

// @deprecated aliases (prefer z.core.$Zod...)
export type ZodFlattenedError = $ZodFlattenedError;
export type ZodFormattedError = $ZodFormattedError;
export type ZodErrorMap      = $ZodErrorMap;
export type IssueData        = $ZodRawIssue;
```

## 12. Helper Types

```ts
// external.d.ts
export type { infer, output, input } from "../core/index.js";
export type { JSONType } from "../core/util.js";
export const $output: typeof core.$output;
export const $input:  typeof core.$input;
export const $brand:  typeof core.$brand;

// compat.d.ts (legacy aliases)
export type TypeOf  = output;   // @deprecated → z.output
export type Infer   = output;   // @deprecated → z.output
export type ZodFirstPartySchemaTypes = $ZodTypes;  // @deprecated
export type ZodTypeAny = ZodType;  // @deprecated → z.ZodType (no generics)
export type ZodSchema = ZodType;   // @deprecated
export type Schema    = ZodType;   // @deprecated
export type inferFlattenedErrors<T, U>: $ZodFlattenedError<output<T>, U>;
export type inferFormattedError<T, U>: $ZodFormattedError<output<T>, U>;
export type BRAND<T> = { [$brand]: { [k in T]: true } };
```

## 13. ZodIssueCode (compat, @deprecated)

Raw issue codes (preferred over `ZodIssueCode` enum):

```
"invalid_type" | "too_big" | "too_small" | "invalid_format"
| "not_multiple_of" | "unrecognized_keys" | "invalid_union"
| "invalid_key" | "invalid_element" | "invalid_value" | "custom"
```

## 14. Checks namespace (checks.d.ts) & External exports (external.d.ts)

```ts
// checks.d.ts — re-exports (prefixed `_` renamed to public):
export { lt, lte, gt, gte, positive, negative, nonpositive, nonnegative,
  multipleOf /* was .step() */, maxSize, minSize, size,
  maxLength, minLength, length, regex, lowercase, uppercase,
  includes, startsWith, endsWith, property, mime, overwrite, normalize,
  trim, toLowerCase, toUpperCase, slugify,
  type RefinementCtx = $RefinementCtx };

// external.d.ts — re-exports everything:
export * as core from "../core/index.js";
export * from "./{schemas,checks,errors,parse,compat}.js";
export type { infer, output, input };
export type { JSONType };
export {
  globalRegistry, registry, config, $output, $input, $brand,
  clone, regexes, treeifyError, prettifyError, formatError, flattenError,
  TimePrecision, util, NEVER,
  toJSONSchema /* json-schema-processors */,
  fromJSONSchema /* ./from-json-schema */,
  ZodISODateTime, ZodISODate, ZodISOTime, ZodISODuration,
};
export * as locales from "../locales/index.js";
export * as coerce from "./coerce.js";
export * as iso from "./iso.js";
```

## 15b. Standalone functions (parse.d.ts) & error utilities

```ts
// Standalone parse/encode/decode — usable as z.parse(schema, value)
export type ZodSafeParseResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ZodError<T> };
export const parse<T>(schema, value, ctx?, params?): output<T>;
export const parseAsync<T>, safeParse<T>, safeParseAsync<T>;
export const encode/decode/encodeAsync/decodeAsync/safeEncode/safeDecode/safeEncodeAsync/safeDecodeAsync

// New top-level error utilities:
z.treeifyError(err)   // replaces deprecated ZodError.format()
z.flattenError(err)   // replaces deprecated ZodError.flatten()
z.prettifyError(err)  // pretty-printed string
z.formatError(err)    // single issue formatting
```

## 16. v4 Breaking Changes vs v3

- **Error**: `ZodError.format()` → `z.treeifyError()`; `flatten()` → `z.flattenError()`; `addIssue/addIssues` → push `.issues`; `isEmpty` → `.issues.length===0` (all deprecated); `z.ZodIssue` type → `z.core.$ZodIssue`; `IssueData` → `z.core.$ZodRawIssue`
- **Number**: `.safe()` ≡ `.int()` (deprecated); `.step()` → `.multipleOf()`; `.finite()` no-op (deprecated); `isInt`/`isFinite` props deprecated → check `format`; `.int()` legacy → `z.int()`
- **String formats**: all `ZodString.email()/.url()/.uuid()…` deprecated → top-level `z.email()` etc.; `.datetime()/.date()/.time()/.duration()` → `z.iso.*`
- **Enum/Literal**: `z.nativeEnum()` → merged into `z.enum(EnumObj)`; multi-literal `z.literal(["a","b"])` now valid (new)
- **Object**: `.passthrough()` → `z.looseObject()`/`.loose()`; `.merge()` → `A.extend(B.shape)`
- **Schema**: `_def`/`_input`/`_output` → `.def`/`z.input`/`z.output`; `isOptional()`/`isNullable()` → `safeParse(undefined\|null).success`; `ZodTypeAny`/`ZodSchema`/`Schema` → `ZodType`; `TypeOf`/`Infer` → `z.output<T>`; `ZodFirstPartySchemaTypes` → `z.core.$$ZodFirstPartyTypes`
- **Codes/Map/Class**: `ZodIssueCode` enum → raw string literals (`"invalid_type"` etc.); `setErrorMap`/`getErrorMap` → `z.config(params)`; `ZodFirstPartyTypeKind` enum → stub (only for `zod-to-json-schema` compat)
- **Misc**: `.removeDefault()`/`.removeCatch()` → `.unwrap()`; `minDate`/`maxDate` props deprecated; `z.cuid()` v1 → `z.cuid2()`; `z.rawShape()` does NOT exist → use `schema.shape`
- **Standard/Pipe**: all schemas include `"~standard"` (standard-schema spec); `z.preprocess()` retained as standalone `preprocess(fn, schema)`

### v4 entry points (package.json exports)

```
zod            → v4 classic
zod/v4         → v4 classic
zod/v4-mini   → v4 mini (no Zod legacy names)
zod/v4/core   → core only ($-prefixed types)
zod/v4/locales→ locale-specific error maps
zod/v3         → v3 compat layer
zod/mini      → mini alias
```

## 17. New in v4 (not in v3)

- `z.iso.*` — ISO date/time/duration namespace
- `z.xor()` — exclusive-or union (exactly one must match)
- `z.stringFormat()` — custom string formats (regex or fn)
- `z.hostname()`, `z.hex()`, `z.hash()`, `z.mac()`, `z.httpUrl()`
- `z.partialRecord()`, `z.looseRecord()`, `z.looseObject()`, `z.strictObject()`
- `z.json()` — JSON validator (recursive union)
- `z.file()` — file validator with `.min/.max/.mime`
- `z.codec()`, `z.invertCodec()`, `z.stringbool()`
- `z.preprocess(fn, schema)` — standalone preprocess
- `z.safeExtend()` — type-safe object extension
- `z.int/float32/float64/int32/uint32/int64/uint64()` — typed number formats
- `.brand()` — instance method with `in|out|inout` direction
- `z.toJSONSchema()` / `z.fromJSONSchema()` — two-way conversion
- `z.treeifyError/z.prettifyError/z.formatError/z.flattenError` — error utilities
- `z.config(params)` — error map configuration
- `.apply(fn)` — method on ZodType
- Async-first: `parseAsync/safeParseAsync` + `encode/decode/safeEncode/safeDecode`
- `$output<T>`/`$input<T>` — typed sentinels for schema annotation
- `$brand` — symbol exported alongside `.brand()` method
- `z.locales` — namespace for localized error messages
- `z.registry`/`z.globalRegistry` — registries for metadata
- `z.regexes` — exported regex helpers; `z.clone` — clone utility
# @hookform/resolvers v5.5.7 — Zod Integration Research

Source: `node_modules/@hookform/resolvers/` (v5.5.7). Type declarations only.

## 1. zodResolver — All 4 Overloads

From `zod/dist/zod.d.ts`. The function is overloaded 4×: 2 for zod3 (non-raw, raw) + 2 for zod4 (non-raw, raw).

```typescript
// (a) Zod v3 — non-raw: Output is the parsed/transformed output
export declare function zodResolver<Input extends FieldValues, Context, Output>(
  schema: Zod3Type<Output, Input>,
  schemaOptions?: Zod3ParseParams,
  resolverOptions?: NonRawResolverOptions
): Resolver<Input, Context, Output>;

// (b) Zod v3 — raw: Output collapses to Input (raw form values retained)
export declare function zodResolver<Input extends FieldValues, Context, Output>(
  schema: Zod3Type<Output, Input>,
  schemaOptions: Zod3ParseParams | undefined,
  resolverOptions: RawResolverOptions
): Resolver<Input, Context, Input>;

// (c) Zod v4 — non-raw: Input/Output pulled from schema via z4.input<T>/z4.output<T>
export declare function zodResolver<
  Input extends FieldValues, Context, Output,
  T extends Zod4Type<Output, Input> = Zod4Type<Output, Input>
>(
  schema: T,
  schemaOptions?: Zod4ParseParams,
  resolverOptions?: NonRawResolverOptions
): Resolver<z4.input<T>, Context, z4.output<T>>;

// (d) Zod v4 — raw: Output collapses to z4.input<T>
export declare function zodResolver<
  Input extends FieldValues, Context, Output,
  T extends Zod4Type<Output, Input> = Zod4Type<Output, Input>
>(
  schema: Zod4Type<Output, Input>,
  schemaOptions: Zod4ParseParams | undefined,
  resolverOptions: RawResolverOptions
): Resolver<z4.input<T>, Context, z4.input<T>>;
```

### Overload selection rules
- **Non-raw** (default): `resolverOptions` is `undefined` or `{ raw?: false }` → 3rd type param = parsed `Output`.
- **Raw**: `resolverOptions` must be `{ raw: true }` → 3rd type param collapses to `Input` (form keeps raw values, no transform applied).
- **Zod3 vs Zod4**: disambiguated by the schema type shape (see §2). TS picks the first matching overload.

## 2. Zod3Type vs Zod4Type — version detection

```typescript
interface Zod3Type<O = unknown, I = unknown> {
  _output: O;  // zod v3 schema exposes _output / _input
  _input: I;
  _def: object;
}

interface Zod4Type<Output = unknown, Input = unknown> {
  _zod: {       // zod v4 schema exposes _zod.output / _zod.input
    output: Output;
    input: Input;
  };
}
```

Detection is **structural**, not runtime: TS overload resolution checks whether the passed schema shape-matches `Zod3Type` (`_output`/`_input`/`_def`) or `Zod4Type` (`_zod.output`/`_zod.input`). A v4 schema won't satisfy `Zod3Type` (no `_output`/`_input`) and vice versa.

## 3. Zod3ParseParams vs Zod4ParseParams

Both use an `UnresolvedFallback` helper that falls back to an inline shape if `zod` types are unresolved (e.g. `zod` absent from project).

```typescript
type IsUnresolved<T> = PropertyKey extends keyof T ? true : false;
type UnresolvedFallback<T, Fallback> =
  IsUnresolved<typeof z3> extends true ? Fallback : T;

// z3 fallback (mirrors ZodErrorMap / ParseParams shape):
type Zod3ParseParams_fallback = {
  path?: (string | number)[];
  errorMap?: (iss: FallbackIssue, ctx: { defaultError: string; data: any }) => { message: string };
  async?: boolean;
};

// z4 fallback (mirrors ParseContext options):
type Zod4ParseParams_fallback = {
  readonly error?: (iss: FallbackIssue) => null | undefined | string | { message: string };
  readonly reportInput?: boolean;
  readonly jitless?: boolean;
};
```

`FallbackIssue` is `{ code: string; message: string; path: (string|number)[] }`.

- `zodResolver` (zod3) — 2nd arg: `schemaOptions?: Zod3ParseParams` (e.g. `{ errorMap, path, async }`)
- `zodResolver` (zod4) — 2nd arg: `schemaOptions?: Zod4ParseParams` (already flagged "already partial" in comments — the inner type is itself `Partial`-like)

## 4. RawResolverOptions vs NonRawResolverOptions

```typescript
type RawResolverOptions = {
  mode?: 'async' | 'sync';
  raw: true;           // REQUIRED: keeps form values un-parsed
};
type NonRawResolverOptions = {
  mode?: 'async' | 'sync';
  raw?: false;         // OPTIONAL (default behaviour)
};
```

- `raw: true` → overload (b)/(d): the form's `values` type stays `Input` instead of `Output`. Use when you want validation against the schema but form state to retain raw (un-transformed) user input.
- `raw: false` (or omitted) → overload (a)/(c): form `values` become the parsed `Output` type.

## 5. Mode option

```typescript
mode?: 'async' | 'sync';
```

Lives in both resolver-options types. Tells `zodResolver` whether to invoke the schema synchronously (`schema.safeParse`) or asynchronously (`schema.parse`-awaited). `'async'` is the typical default (supports async refinements / transforms); `'sync'` forces synchronous validation (useful for performance when the schema has no async work).

## 6. How zodResolver bridges to react-hook-form's Resolver

`react-hook-form`'s `Resolver<Input, Context, Output>` signature (simplified) is:

```typescript
type Resolver<TFieldValues, TContext, TTransformedValues> = (
  values: TFieldValues,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>
) => Promise<ResolverResult<TFieldValues, TTransformedValues>> | ResolverResult<...>;
// ResolverResult = { values: TTransformedValues; errors: FieldErrors }  (success)
//                | { values: {}; errors: FieldErrors }                   (failure)
```

`zodResolver` returns a function conforming to `Resolver`:
- Non-raw overloads: on success, returns `values` typed as the schema's **output** ({Output} / `z4.output<T>`) — i.e. parsed + transformed.
- Raw overloads: returns `values` typed as the schema's **input** ({Input} / `z4.input<T>`) — parsed ONLY for validation purposes, but the form keeps the un-transformed `Input` shape.
- On failure, returns `errors` mapped from zod issue `{ path, message, code }` into react-hook-form `FieldErrors` (via `toNestErrors` utility re-exported from the main entry).

Type-level bridge: the `Output`/third generic of `Resolver` becomes what `react-hook-form`'s `handleSubmit((values: Output) => ...)` receives — type-safe transformations out of the box.

## 7. All available resolver subpaths (exports map)

Subpaths in `package.json` `exports` (import via `@hookform/resolvers/<name>`):

| Subpath | Resolver function(s) |
|---|---|
| `./zod` | `zodResolver` |
| `./yup` | `yupResolver` |
| `./joi` | `joiResolver` (re-exports `./types`) |
| `./vest` | `vestResolver` (re-exports `./types`) |
| `./superstruct` | `superstructResolver` |
| `./class-validator` | `classValidatorResolver` |
| `./io-ts` | `ioTsResolver` |
| `./nope` | `nopeResolver` (re-exports `./types`) |
| `./computed-types` | `computedTypesResolver` |
| `./typanion` | `typanionResolver` |
| `./ajv` | `ajvResolver` (re-exports `./types`) |
| `./typebox` | `typeboxResolver` |
| `./valibot` | `valibotResolver` |
| `./typeschema` | `typeschemaResolver` |
| `./arktype` | `arktypeResolver` |
| `./effect-ts` | `effectTsResolver` |
| `./vine` | `vineResolver` |
| `./fluentvalidation-ts` | `fluentValidationResolver`, `fluentAsyncValidationResolver` |
| `./standard-schema` | `standardSchemaResolver` |
| `./ata-validator` | `ataValidatorResolver` (re-exports `./types`) |
| `.` (main) | `toNestErrors`, `validateFieldsNatively` (utilities only — NOT resolvers) |
| `./package.json` | metadata |
| `./*` | wildcard passthrough |

The `dist/index.d.ts` main entry exports ONLY utility functions (`toNestErrors`, `validateFieldsNatively`) — all resolvers must be imported via their dedicated subpath (e.g. `import { zodResolver } from '@hookform/resolvers/zod'`).

## 8. @deprecated tags

**None.** A repo-wide grep across all `*.d.ts` files in `@hookform/resolvers/` found zero `@deprecated` annotations. v5.5.7 surfaces no deprecations in the type declarations examined.

## Notes
- `zod` is an **optional peer dependency**: `^3.25.0 || ^4.0.0`. v5.5.7 supports both zod v3 and v4 simultaneously via overloads.
- `react-hook-form` peer dep: `^7.55.0`. Wallet-form `Resolver` generic shape assumes RHF ≥7.55.
- `fluentvalidation-ts` is the only subpath offering two distinct resolver functions (`fluentValidationResolver` sync + `fluentAsyncValidationResolver` async).

---

## Usage Examples for Certificate Templates

### Template Editor Form with Validation

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  orientation: z.enum(['portrait', 'landscape']),
  width: z.number().int().positive().min(100).max(2000),
  height: z.number().int().positive().min(100).max(2000),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  elements: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['text', 'image', 'qrcode', 'signature', 'border']),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })).max(50),
});

type TemplateFormValues = z.input<typeof templateSchema>;

function TemplateEditorForm({ defaultValues }: { defaultValues: TemplateFormValues }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = (data: TemplateFormValues) => {
    // Save template
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Template Name"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            sx={{ mb: 2 }}
          />
        )}
      />
      {/* ... more fields */}
    </form>
  );
}
```

### Certificate Generation Form with Dynamic Fields

```typescript
const certificateSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientEmail: z.string().email('Invalid email'),
  templateId: z.string().uuid(),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

type CertificateFormValues = z.input<typeof certificateSchema>;

function CertificateGenerationForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      templateId: '',
      issueDate: new Date().toISOString(),
    },
  });

  // ...
}
```

### Integration with MUI v9 TextField

```tsx
<Controller
  name="recipientName"
  control={control}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      label="Recipient Name"
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      fullWidth
      sx={{ mb: 2 }}
    />
  )}
/>
```

### Integration with Zustand Stores

```tsx
// Bridge form data to Zustand store
function TemplateEditor() {
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);
  const isLoading = useTemplateStore((s) => s.isLoading);
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: useTemplateStore.getState().currentTemplate,
  });

  const onSubmit = (data: TemplateFormValues) => {
    updateTemplate(data);
  };

  return (
    <Form {...form}>
      {/* form fields */}
    </Form>
  );
}
```

## Gotchas & Warnings

1. **Zod v4 default export changed**: `import { z } from 'zod'` resolves to v4 automatically, but `import { z } from 'zod/v3'` is needed for legacy code
2. **`z.input` vs `z.output`**: Use `z.input` for form values (before transformations), `z.output` for parsed result (after transformations)
3. **Resolver generic ordering**: `zodResolver<z.input<T>, Context, z.output<T>>(schema)` — input first, output third
4. **`raw: true` in resolver**: Keeps form values as `Input` type (pre-pipeline). Default is `raw: false` which gives `Output` type
5. **Form `mode` vs `reValidateMode`**: `mode: 'onBlur'` validates on blur first, `reValidateMode: 'onChange'` re-validates on change after first error
6. **`shouldUnregister: true`**: Removes field from state when unmounted — important for dynamic field arrays in conditional rendering
7. **`defaultValues` is required** for `Controller` and `useController` to work properly
8. **`formState.isValid`**: Only meaningful when `mode: 'onChange'` or `mode: 'all'` with a resolver
9. **NestedValue deprecated**: Will be removed in next major — avoid using it in new code
10. **WatchProps.names deprecated**: Renamed to `name` — use `name` prop instead
11. **`watch()` subscriptions**: Each render triggers watch callbacks — use `useWatch` for component-level subscriptions to avoid re-renders
12. **`z.record(z.string(), z.string())`**: In v4, `z.record()` requires both key and value types explicitly
13. **`z.enum()` v4**: Uses array syntax in v4 — `z.enum(['a', 'b'])` still works but internal implementation changed
14. **`nativeEnum` deprecated in v4**: Use `z.enum()` with `as const` arrays instead
15. **`ZodIssueCode` enum deprecated**: Use raw string codes directly instead
16. **`z.transform()` vs `.transform()`**: Standalone `z.transform()` exists in v4, but `.transform()` on a schema is more common
17. **ZodError methods deprecated**: Several methods on ZodError are deprecated in v4 — use `flattenError`, `formatError`, `treeifyError`, `prettifyError` functions instead

## Integration Patterns with Siraj Conventions

### MUI v9 sx Prop Pattern
```tsx
<Controller
  name="name"
  control={control}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      sx={{ mb: 2, width: '100%' }}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

### Zustand Store Integration
- Read form default values from store state
- On submit, write back to store via `updateXxx` action
- Use `shouldUnregister: false` (default) to keep field values when components re-render

### Error Handling
- Use `formState.errors` for field-level error display
- Use `formState.errors.root?.server` for server-side errors
- Map zod error messages to user-facing strings via i18n translation system

### I18n Integration
- Define error message keys in `shared/locale/` translation files
- Use `z.string().refine()` with custom error functions that return translated messages
- Or use `setError` with translated messages after `zodResolver` validation

## Summary Table

| Package | Version | Key APIs | Deprecations | Gotchas |
|---------|---------|----------|--------------|---------|
| react-hook-form | 7.83.0 | useForm, Controller, useFieldArray, useFormContext, useWatch, useFormState, useController | NestedValue (next major), WatchProps.names→name | defaultValues required for Controller, formState.isValid needs resolver+mode, watch causes re-renders |
| zod | 4.4.3 | z.object, z.string, z.number, z.enum, z.array, z.record, z.union, z.discriminatedUnion, z.coerce, .transform, .refine, .pipe | nativeEnum, ZodIssueCode enum, several ZodError methods, standalone format methods (email/url/uuid now standalone builders) | v4 auto-import from 'zod', z.record requires key+value types, module-format methods now standalone builders |
| @hookform/resolvers | 5.5.7 | zodResolver (4 overloads for zod3/zod4 × raw/non-raw), toNestErrors | None found | Version detection is structural (not runtime), raw:true keeps Input type, mode:'sync' uses safeParse |
