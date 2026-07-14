# Login Page Migration — Pilot

Status: ✅ Complete

## Files Changed

### New Files Created (Foundation)
- `shared/locale/AppLocale.ts` — locale enum & type
- `shared/locale/server.ts` — `getTranslations(locale, namespace)` for SSR & APIs
- `shared/locale/client.ts` — `useAppTranslation(namespace)` hook
- `shared/locale/index.ts` — barrel re-export
- `shared/locale/types/auth/index.ts` — AuthLabels type schema (with function types for interpolation)
- `shared/locale/types/message.ts` — MessageSchema (top-level namespace map)
- `shared/locale/ar/auth/index.ts` — Arabic auth translations
- `shared/locale/en/auth/index.ts` — English auth translations
- `frontend/common/providers/LocaleProvider.tsx` — React context bridge

### Modified Files
- `app/layout.tsx` — wires LocaleProvider, loads auth translations server-side
- `app/[locale]/(auth)/login/page.tsx` — uses new `getTranslations` for metadata
- `frontend/views/auth/login/index.tsx` — LoginContainer migrated
- `frontend/views/auth/login/components/LoginForm.tsx` — fully migrated
- `frontend/views/auth/login/components/LoginHeader.tsx` — fully migrated
- `frontend/views/auth/login/components/DemoFastLogin.tsx` — fully migrated

## Key Changes

### Before → After Access Pattern
```typescript
// Before
const t = useTranslations("auth.login");
t("email")              // runtime string lookup
t("loginSuccess")       // runtime string lookup

// After
const t = useAppTranslation("auth").login;
t.email                 // ← compile-time property access ✅
t.loginSuccess          // ← compile-time property access ✅
```

### Before → After Interpolation
```typescript
// Before (ICU string in translation file)
bannerLoggedInAs: "أنت مسجل الدخول باسم {name}."
// ...usage:
t("bannerLoggedInAs", { name: user.name })  // runtime parsed

// After (TypeScript function in translation file)
bannerLoggedInAs: (name) => `أنت مسجل الدخول باسم ${name}.`
// ...usage:
t.impersonation.bannerLoggedInAs(user.name)  // ← compile-time typed args ✅
```

### Server Component (page.tsx)
```typescript
// Before
import { getTranslations } from "next-intl/server";
const t = await getTranslations({ locale, namespace: "auth.login" });
return { title: t("pageTitle") };

// After
import { getTranslations } from "@/shared/locale/server";
const t = await getTranslations(locale, "auth");
return { title: t.login.pageTitle };  // ← compile-time ✅
```

## What Is NOT Changed
- `shared/i18n/routing.ts` — untouched (still used by other pages via next-intl)
- `shared/messages/` directory — untouched (still used by non-migrated pages)
- `NextIntlClientProvider` in layout — kept (required for non-migrated namespaces)
- `next-intl` package — still installed (remove only after all pages are migrated)
