# Decision questions index

Read each file, then reply with your choices in one message.

## Locked already (payment)

- **No payment credentials** (no cards, PSP tokens, passwords, OAuth secrets)
- **Routing details only** (PayPal email, IBAN, wallet phone, …) so payment can be made externally
- **Multiple payment methods per user**

See [01-payment-methods-model.md](./01-payment-methods-model.md) for examples of store vs do-not-store.

| # | Topic | File |
|---|--------|------|
| 1 | Payment methods **table model** (type + JSONB) | [01-payment-methods-model.md](./01-payment-methods-model.md) — **DECIDED 1A** |
| 1b | Defaults when user has **multiple** methods | [01b-payment-defaults.md](./01b-payment-defaults.md) — **DECIDED 1bA** |
| 2 | Method types + wallet/link/**online** **catalogs** | [02-payment-methods-v1-set.md](./02-payment-methods-v1-set.md) — **DECIDED** (`ONLINE_ACCOUNT` replaces PayPal/Wise enums) |
| 3 | Currency: locked money vs UI display (+ FX) | [03-currency-vs-rate-currency.md](./03-currency-vs-rate-currency.md) — **DECIDED 3A** |
| 4 | Timezone modeling | [04-timezone-model.md](./04-timezone-model.md) — **DECIDED 4A** |
| 5 | Meeting configs (how many per user) | [05-meeting-configs-cardinality.md](./05-meeting-configs-cardinality.md) |
| 6 | Fate of `staff_profiles` | [06-staff-profiles-fate.md](./06-staff-profiles-fate.md) |
| 7 | Status on users | [07-status-on-users.md](./07-status-on-users.md) |
| 8 | Migration strategy | [08-migration-strategy.md](./08-migration-strategy.md) — **DECIDED 8C clean-slate** |

## Reply format example

```
5A
6A
7A
```

Already decided: **1A**, **1bA**, **2** (catalogs + standards; PayPal/Wise → `ONLINE_ACCOUNT` catalog), **3A**, **4A** (IANA varchar + generated GraphQL enum), **8C** (clean-slate).

After you answer the rest, we lock a `DECISIONS.md` and craft the full implementation plan.
