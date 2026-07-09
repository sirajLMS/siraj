# BANK_TRANSFER — UI principle

**Enum:** `PaymentMethodType.BANK_TRANSFER`  
**No catalog table** — user enters routing details directly.  
**User details:** `BankTransferDetails` (IBAN, bank name, beneficiary, SWIFT, account/routing numbers)

Replaces `BankingLedgerSection.tsx`. Admin **verification** is a separate action, not part of the user form.

---

## User — create / update payment method

**Component:** `PaymentMethodTypeFields` when `type === BANK_TRANSFER`  
Shared shell: type, direction, optional `label`, default toggles (see spec).

### Wireframe

```
ⓘ Bank details require admin verification before payouts.

Beneficiary name *     [ Ahmed Hassan                 ]
Bank name *            [ National Bank of Egypt       ]

IBAN                   [ EG12 3456 …                ]  dir=ltr
Account number         [                            ]  dir=ltr
Routing number         [                            ]  dir=ltr
SWIFT / BIC            [ NBEGEGCX                   ]  dir=ltr

At least one of IBAN, account number, or routing number required.
```

### Field → component

| `details` key | Component | Notes |
|---------------|-----------|-------|
| `beneficiaryName` | `TextField` | Required for payout flows |
| `bankName` | `TextField` | |
| `iban` | `TextField` `dir="ltr"` | |
| `accountNumber` | `TextField` `dir="ltr"` | |
| `routingNumber` | `TextField` `dir="ltr"` | |
| `swiftBic` | `TextField` `dir="ltr"` | Optional |

All labels from `next-intl` `ui.paymentMethod.fields.*` (same keys as legacy banking section).

**No** `LocalizedStringInput` — user bank names may be Arabic or English; stored as-is (Zone C).

### Update mode

Sensitive fields show masked value from GraphQL until user clicks **Change**:

```
IBAN    [ •••• •••• 9012 3 ]  [ Change ]
```

### Verification UI (read-only on form)

| State | Component |
|-------|-----------|
| Unverified | `Chip` color=warning — `t("verification.pending")` |
| Verified | `Chip` color=success — `t("verification.verified")` |

Admin verifies via separate mutation `verifyBankTransferPaymentMethod` — button on admin profile / payment method list, not in user edit dialog.

### Display (`PaymentMethodDisplay`)

```
Bank transfer                    [Pending verification]
Ahmed H••••••
•••• •••• •••• 9012 3
```

Uses `maskedDetails` from GraphQL — no client-side masking.

### Snackbar (user save)

```ts
notifications.show(t("saveSuccess"), { severity: "success", autoHideDuration: 4000 });
```

---

## Grid layout (MUI)

Mirror `BankingLedgerSection`: `Grid container spacing={3}` — beneficiary `md=8`, bank name `md=4`, IBAN full width, account/routing/SWIFT in `md=4` columns.

---

## Prototype HTML

```html
<section data-type="BANK_TRANSFER">
  <aside data-i18n="bankVerificationHint" />

  <input name="details.beneficiaryName" required />
  <input name="details.bankName" required />
  <input name="details.iban" dir="ltr" autocomplete="off" />
  <input name="details.accountNumber" dir="ltr" />
  <input name="details.routingNumber" dir="ltr" />
  <input name="details.swiftBic" dir="ltr" />

  <span data-chip="verification-status" />
</section>
```

---

## No admin catalog form

Bank transfer has no logo upload or `LocalizedStringInput` on catalog. Only user method CRUD + admin verify action.
