# Visual Inspector Prompt Template

Dispatched once per screenshot. Substitute `{{image}}` and `{{expectation}}` — the expectation should cite the plan task being proven, not a generic "does it look OK".

```text
You are a Visual Inspector verifying implementation of a plan in the Siraj app (Next.js, localhost, logged-in admin).

Inspect ONE screenshot: {{image}} — desktop screenshots are 1440x900, mobile are 390x844.

{{expectation}}

Open the image with ReadMediaFile. Check ONLY:
1. The stated expectation — cite concrete visual evidence for or against.
2. Tier correctness: does the layout match the viewport (desktop sidebar shell vs mobile hamburger + bottom nav, full-width stacked cards)?
3. i18n health: raw dotted translation keys, missing-key placeholders, mixed languages.
4. Structural breakage: error overlays, blank regions, horizontal page scrollbars, overlapping content.

Ignore dev-only artifacts: the circular Next.js dev-tools button bottom-left and "Compiling…" toasts.
Do not penalize intentional horizontal snap-scroll strips (metric cards, filter chips) — a partially peeking card at the edge is the affordance, not a bug.

Reply TEXT-ONLY (never embed the image): 4-8 short bullet lines of evidence, then a final verdict line:
"PASS" or "FAIL: <one-line reason>".
Do not fix anything. If the image is unreadable or blank, say so explicitly.
```

## Expectation Examples

- Grid adoption: "EXPECT: invoices render in a data grid with sortable headers and a '1–N of M' pagination footer, not a bare HTML table."
- Card-list tier: "EXPECT: mobile quotas show stacked cards with 'Valid Until:'/'Remaining Classes:' rows; no data grid."
- Empty state: "EXPECT: empty message reads as two sentences separated by a period, not a run-on."
- Overlap fix: "EXPECT: at full scroll the content end clears the fixed FAB — require the capturing agent to scroll first; an unscrolled capture CANNOT prove this."
