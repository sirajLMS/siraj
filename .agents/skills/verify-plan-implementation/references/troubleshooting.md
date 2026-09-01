# Troubleshooting — plan verification sessions

## Auth: "inject" fails or page shows the login form

- Symptom: `browser-login.ts --inject` prints "Daemon process exited during startup" or the app keeps redirecting to login.
- Fix: open any page once (`agent-browser open http://localhost:3000/dashboard`) to bring the browser daemon up, then re-run the inject command. Verify with a snapshot — an authenticated dashboard shows nav groups, not email/password fields.
- Fallback (dev only): the login page carries quick-role buttons ("Full system access…"); clicking one authenticates without typing.
- Cookies die with `agent-browser close` unless the session was started with `--restore`; re-run the inject after reopening.

## Viewport: `resize` is not a command

- `agent-browser resize 390 844` fails with "Unknown command: resize". The correct command is `agent-browser set viewport <w> <h>`.
- Always confirm with `agent-browser eval "innerWidth"` afterwards; a failed switch silently keeps the old size and mixes tiers into your evidence set.

## Stale element refs

`@eN` refs expire on every DOM change. "Ref not found" → re-snapshot (`agent-browser snapshot -i -c`) and use fresh refs.

## Empty or spinner captures

Next.js lazy chunks (tier views load via `createLazyView` + `next/dynamic`) render a Suspense spinner on first mount. If a capture shows only a spinner: wait 2–3 s or re-open with `wait --load networkidle`, then re-capture. Never screenshot mid-load as defect evidence.

## Scroll-target traps

`agent-browser scroll down N` scrolls the window; the dashboard mobile shell keeps its own scroll container. For "content must clear a fixed FAB"-type checks, locate the scrollable element in `eval`, set `scrollTop = scrollHeight` directly, then measure or screenshot.

## Tier verification via fiber walk

To prove which component tree mounted (beyond CSS guessing), find a text node, then walk React fibers:

```js
const el = [...document.querySelectorAll('main *')].find(e => e.children.length===0 && e.textContent?.includes('Some Known Label'));
let fiber = el[Object.keys(el).find(k => k.startsWith('__reactFiber$'))];
const names = [];
for (let i=0;i<60 && fiber;i++){ const t=fiber.type; const n=typeof t==='function'?(t.displayName||t.name):null; if(n) names.push(n); fiber=fiber.return; }
names.join(' > ');
```

Look for `XxxMobile` vs `XxxDesktop` names above the leaf, and the enclosing `ResponsiveViewSwitch`.
