---
name: "02: Fix all useAppTranslation('ui') calls to use specific sub-namespaces"
overview: "Change all useAppTranslation('ui').xxx calls to useAppTranslation('ui.xxx')"
todos:
  - id: "1"
    content: Fix PaymentMethodDisplay.tsx - useAppTranslation("ui").paymentMethod
    status: "pending"
  - id: "2"
    content: Fix PaymentMethodList.tsx - useAppTranslation("ui").paymentMethod
    status: "pending"
  - id: "3"
    content: Fix PaymentMethodAutocomplete.tsx - useAppTranslation("ui").paymentMethod.select
    status: "pending"
  - id: "4"
    content: Fix PaymentMethodTypeFields.tsx - useAppTranslation("ui").paymentMethod.typeFields
    status: "pending"
  - id: "5"
    content: Fix PaymentMethodTypeSelector.tsx - useAppTranslation("ui").paymentMethod.typeSelector
    status: "pending"
  - id: "6"
    content: Fix PaymentMethodDefaultsEditor.tsx - useAppTranslation("ui").paymentMethod
    status: "pending"
  - id: "7"
    content: Fix UserPaymentMethodAutocomplete.tsx - useAppTranslation("ui").paymentMethod
    status: "pending"
  - id: "8"
    content: Fix MeetingConfigSelect.tsx - useAppTranslation("ui").meetingConfig.classScope
    status: "pending"
  - id: "9"
    content: Fix MeetingConfigTypeFields.tsx - useAppTranslation("ui").meetingConfig.fields
    status: "pending"
  - id: "10"
    content: Fix MeetingProviderSelect.tsx - useAppTranslation("ui").meetingConfig.providerSelect
    status: "pending"
  - id: "11"
    content: Fix PhoneCountryPicker.tsx - useAppTranslation("ui").phoneInput
    status: "pending"
  - id: "12"
    content: Fix PhoneInput.tsx - useAppTranslation("ui").phoneInput
    status: "pending"
  - id: "13"
    content: Fix TagInput.tsx - useAppTranslation("ui").tagInput
    status: "pending"
  - id: "14"
    content: Fix TimezoneSelect.tsx - useAppTranslation("ui").timezoneSelect
    status: "pending"
  - id: "15"
    content: Fix MetricCardGrid.tsx - useAppTranslation("common") - already correct
    status: "pending"
  - id: "16"
    content: Fix profile shared meeting-configs components
    status: "pending"
  - id: "17"
    content: Fix teacher schedule weekly components
    status: "pending"
  - id: "18"
    content: Fix mobile reschedule view
    status: "pending"
isProject: false
---

# Plan 02: Fix All useAppTranslation('ui') Calls

## Files to Modify (25+ files)
All components using `useAppTranslation("ui")` need to be changed to use specific sub-namespaces.

## Pattern
Change:
```typescript
const t = useAppTranslation("ui").paymentMethod;
```
To:
```typescript
const t = useAppTranslation("ui.paymentMethod");
```

Or if accessing nested properties:
```typescript
const t = useAppTranslation("ui.paymentMethod");
const tDisplay = t.display; // instead of t.paymentMethod.display
```

## Key Files
- `frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplay.tsx`
- `frontend/common/components/ui/display/paymentMethod/PaymentMethodList.tsx`
- `frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete.tsx`
- `frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFields.tsx`
- `frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector.tsx`
- `frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditor.tsx`
- `frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocomplete.tsx`
- `frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelect.tsx`
- `frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields.tsx`
- `frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect.tsx`
- `frontend/common/components/ui/input/phoneInput/PhoneCountryPicker.tsx`
- `frontend/common/components/ui/input/phoneInput/PhoneInput.tsx`
- `frontend/common/components/ui/input/tagInput/TagInput.tsx`
- `frontend/common/components/ui/input/timezoneSelect/TimezoneSelect.tsx`
- Profile shared meeting-configs components (5 files)
- Teacher schedule weekly components
- Mobile reschedule view
