# CASH — UI principle

**Enum:** `PaymentMethodType.CASH`  
**No catalog table**  
**User details:** `{ note?: string }`

Minimal type for in-person payments. No image upload, no `LocalizedStringInput`, no verification.

---

## User — create / update payment method

### Wireframe

```
ⓘ Cash payments are recorded manually. No account details required.

Note (optional)        ┌────────────────────────────────────┐
                       │ Paid at academy front desk         │
                       │                                    │
                       └────────────────────────────────────┘
                       max 200 characters
```

### Field → component

| Field | Component |
|-------|-----------|
| `details.note` | `TextField` `multiline` `rows={2}` `inputProps={{ maxLength: 200 }}` `dir="auto"` |

Shell fields still apply: `direction`, optional `label`, default toggles.

Info `Alert` text from `next-intl` `ui.paymentMethod.cash.info`.

### Display (`PaymentMethodDisplay`)

```
Cash
Paid at academy front desk
```

- Icon: `PaymentsOutlined` when no logo
- Title: user `label` ?? `t("types.cash")`
- Subline: truncated `note` or em dash

### Snackbar

Same `useNotifications` pattern on save success/error.

---

## Prototype HTML

```html
<section data-type="CASH">
  <aside class="alert" data-i18n="cashInfo" />
  <textarea name="details.note" maxlength="200" dir="auto" rows="2" />
</section>
```

---

## Transaction snapshot display

Historical pay-in/pay-out rows show snapshot `type: CASH` and optional `note` — no catalog name, no logo.

```tsx
<PaymentMethodDisplay snapshot={payment.paymentMethodSnapshot} />
```

If snapshot includes frozen `note`, display as-is (Zone C).
