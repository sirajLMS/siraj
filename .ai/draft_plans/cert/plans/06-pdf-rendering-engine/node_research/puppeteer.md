# puppeteer v25.4.0 — Node Module Research

## Package Overview

Puppeteer is a Node.js library that provides a high-level API to control Chrome/Chromium over the DevTools Protocol. It runs headless (no UI) by default and is commonly used for server-side PDF generation, screenshots, web scraping, and automated testing.

The package is split into two npm packages:
- **`puppeteer`** — Full package; `postinstall` downloads Chrome for Testing (~140 MB) into `~/.cache/puppeteer`. Use for local dev / CI where the bundled Chromium is acceptable.
- **`puppeteer-core`** — Same API, **no browser download**. Requires `executablePath` (or `channel`) at launch. Use for serverless / Lambda / Vercel where bundle size matters and the browser binary is supplied externally (e.g. `@sparticuz/chromium`).

## Installation

**Installed version:** `puppeteer@25.4.0` and `puppeteer-core@25.4.0`

**package.json highlights:**
- `"version": "25.4.0"`
- `"type": "module"` (ESM)
- `"engines": { "node": ">=22.12.0" }`
- `"main": "./lib/puppeteer/puppeteer.js"`
- `"types": "./lib/puppeteer/puppeteer.d.ts"`
- `"postinstall": "node install.mjs"` (downloads Chrome for Testing)

**Dependencies (puppeteer):**
- `puppeteer-core` (same version)
- `@sparticuz/chromium` — **NOT installed**; only referenced in planning docs. Must be added if used.

**Type definitions:** Bundled `.d.ts` files in `node_modules/puppeteer-core/lib/puppeteer/`. No `@types/puppeteer` needed.

---

## TypeScript Types & Interfaces

### LaunchOptions (extends ConnectOptions)
**File:** `puppeteer-core/lib/puppeteer/node/LaunchOptions.d.ts`

```ts
interface LaunchOptions extends ConnectOptions {
  executablePath?: string;          // Path to browser executable (required with puppeteer-core)
  channel?: ChromeReleaseChannel;  // 'chrome'|'chrome-beta'|'chrome-canary'|'chrome-dev'
  headless?: boolean | 'shell';    // true = new headless (modern default), 'shell' = old headless shell. 'new' was REMOVED.
  devtools?: boolean;              // Auto-open DevTools
  userDataDir?: string;            // User data dir path
  debuggingPort?: number;          // --remote-debugging-port
  pipe?: boolean;                  // Use pipe transport instead of WebSocket (default false)
  args?: string[];                 // Chrome CLI args (passed to Chrome, not Puppeteer)
  ignoreDefaultArgs?: boolean | string[]; // true = skip all defaults; array = filter specific args
  defaultViewport?: Viewport | null;      // null disables the 800×600 default
  timeout?: number;                // Browser startup timeout (default 30000)
  dumpio?: boolean;                // Pipe browser stdout/stderr to process
  env?: Record<string, string>;    // Custom env vars for browser process
  signal?: AbortSignal;            // Abort browser launch
  protocol?: ProtocolType;         // 'cdp' | 'webDriverBiDi'
  browser?: SupportedBrowser;      // 'chrome' | 'firefox' (default 'chrome')
  extraHosts?: Record<string, string>; // /etc/hosts overrides
}
```

### ConnectOptions (inherited by LaunchOptions)
**File:** `puppeteer-core/lib/puppeteer/common/ConnectOptions.d.ts`

```ts
interface ConnectOptions {
  browserWSEndpoint?: string;
  browserURL?: string;
  transport?: ConnectionTransport;
  defaultViewport?: Viewport | null;  // Default: { width: 800, height: 600 }; null = disable
  targetFilter?: (target: Target) => boolean;
  isPageTarget?: (target: Target) => boolean;
  protocol?: ProtocolType;
  // ... more fields
}
```

### Viewport
**File:** `puppeteer-core/lib/puppeteer/common/Viewport.d.ts`

```ts
interface Viewport {
  width: number;             // CSS pixels (required)
  height: number;            // CSS pixels (required)
  deviceScaleFactor?: number; // Default 1
  isMobile?: boolean;         // Default false
  isLandscape?: boolean;     // Default false
  hasTouch?: boolean;         // Default false
}
```

### PDFOptions
**File:** `puppeteer-core/lib/puppeteer/common/PDFOptions.d.ts`

```ts
interface PDFOptions {
  scale?: number;               // 0.1 – 2.0, default 1
  displayHeaderFooter?: boolean; // Default false
  headerTemplate?: string;       // HTML; classes: date, title, url, pageNumber, totalPages
  footerTemplate?: string;
  printBackground?: boolean;     // Default false — enable for background colors/images
  landscape?: boolean;           // Default false
  pageRanges?: string;           // Default '' (all pages), e.g. '1-5, 8'
  format?: PaperFormat;          // Default 'letter' — TAKES PRIORITY over width/height
  width?: string | number;       // e.g. '8.5in', 595 (px)
  height?: string | number;
  preferCSSPageSize?: boolean;   // Default false — true honors CSS @page rule over all else
  margin?: PDFMargin;            // { top, bottom, left, right }
  path?: string;                 // If set, writes to disk ALSO; if omitted, only returns Uint8Array
  omitBackground?: boolean;      // Default false — true = transparent background
  tagged?: boolean;              // Default true, @experimental — tagged (accessible) PDF
  outline?: boolean;             // Default false, @experimental — document outline/bookmarks
  timeout?: number;               // Default 30000 (0 = disabled)
  waitForFonts?: boolean;         // Default true — waits for document.fonts.ready
}

interface PDFMargin {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

type PaperFormat =
  | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger'
  | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
  // Case-insensitive: accepts upper, capitalized, or lowercase
```

**PaperFormat dimensions (inches → cm):**
| Format | Width × Height (in) | Width × Height (cm) |
|--------|---------------------|---------------------|
| Letter | 8.5 × 11 | 21.59 × 27.94 |
| Legal | 8.5 × 14 | 21.59 × 35.56 |
| Tabloid | 11 × 17 | 27.94 × 43.18 |
| Ledger | 17 × 11 | 43.18 × 27.94 |
| A0 | 33.11 × 46.81 | 84.1 × 118.9 |
| A1 | 23.39 × 33.11 | 59.4 × 84.1 |
| A2 | 16.54 × 23.39 | 42 × 59.4 |
| A3 | 11.69 × 16.54 | 29.7 × 42 |
| A4 | 8.27 × 11.69 | 21 × 29.7 |
| A5 | 5.83 × 8.27 | 14.8 × 21 |
| A6 | 4.13 × 5.83 | 10.5 × 14.8 |

### ScreenshotOptions
```ts
interface ScreenshotOptions {
  optimizeForSpeed?: boolean;     // Default false
  type?: 'png' | 'jpeg' | 'webp'; // Default 'png'
  quality?: number;               // 0–100, not for png
  fromSurface?: boolean;          // Default true
  fullPage?: boolean;             // Default false
  omitBackground?: boolean;        // Default false
  path?: string;                  // Relative to cwd
  clip?: ScreenshotClip;          // { x, y, width, height, scale? }
  encoding?: 'base64' | 'binary'; // Default 'binary'
  captureBeyondViewport?: boolean; // Default false (if no clip), true (if clip)
}
```

### Cookie / CookieParam / CookieData
**File:** `puppeteer-core/lib/puppeteer/common/Cookie.d.ts`

```ts
interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;       // Unix epoch seconds
  size: number;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  priority?: 'Low' | 'Medium' | 'High';
  sameParty?: boolean;
  sourceScheme?: 'Unset' | 'NonSecure' | 'Secure';
  sourcePort?: number;
}

interface CookieParam {
  name: string;
  value?: string;
  domain?: string;
  path?: string;
  url?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  priority?: 'Low' | 'Medium' | 'High';
  sameParty?: boolean;
}

interface CookieData extends Omit<CookieParam, 'expires' | 'size'> {
  expires?: number | string; // string = epoch timestamp; number = epoch seconds
}

interface DeleteCookiesRequest {
  name: string;
  domain?: string;
  path?: string;
  url?: string;
}
```

### HTTPRequest / HTTPResponse (key types)
```ts
interface HTTPRequest {
  url(): string;
  method(): string;
  headers(): Record<string, string>;
  postData(): string | undefined;  // @deprecated — use fetchPostData()
  fetchPostData(): Promise<string | undefined>;
  resourceType(): string;
  response(): HTTPResponse | null;
  frame(): Frame | null;
  isNavigationRequest(): boolean;
  redirectChain(): HTTPRequest[];
  failure(): { errorText: string } | null;
  continue(overrides?, priority?): Promise<void>;
  respond(response, priority?): Promise<void>;
  abort(errorCode?, priority?): Promise<void>;
}

interface HTTPResponse {
  url(): string;
  ok(): boolean;           // status in 200–299
  status(): number;
  statusText(): string;
  headers(): Record<string, string>;
  content(): Promise<Uint8Array>;
  text(): Promise<string>;
  json(): Promise<any>;
  request(): HTTPRequest;
  fromCache(): boolean;
  fromServiceWorker(): boolean;
  frame(): Frame | null;
}
```

### Other Key Types

**GoToOptions** (extends WaitForOptions):
```ts
interface GoToOptions extends WaitForOptions {
  referer?: string;
  referrerPolicy?: string;
}
interface WaitForOptions {
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  timeout?: number;
  signal?: AbortSignal;
}
// PuppeteerLifeCycleEvent = 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' | 'networkidle'
```

**SetContentWaitForOptions** (extends WaitForOptions):
```ts
interface SetContentWaitForOptions extends WaitForOptions {
  // waitUntil EXCLUDES 'networkidle0' | 'networkidle2' in the TS type
  // (but runtime honors them for CDP)
  // Default waitUntil: 'load'
  // timeout default: 30000, 0 = disabled
}
```

**WaitForSelectorOptions:**
```ts
interface WaitForSelectorOptions {
  visible?: boolean;   // Default false
  hidden?: boolean;     // Default false
  timeout?: number;     // Default 30000
  signal?: AbortSignal;
}
```

**CreatePageOptions:**
```ts
interface CreatePageOptions {
  type?: 'tab' | 'window';
  background?: boolean;
}
```

---

## Core API — Functions & Methods

### PuppeteerNode (default export of `import puppeteer from 'puppeteer'`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `launch` | `(options?: LaunchOptions) => Promise<Browser>` | Launches browser. With `puppeteer-core`, `executablePath` or `channel` required. |
| `connect` | `(options: ConnectOptions) => Promise<Browser>` | Attaches to existing browser via WS endpoint. |
| `executablePath` | `(channel?: ChromeReleaseChannel) => Promise<string>` | Default browser path for a channel. |
| `defaultArgs` | `(options?: LaunchOptions) => Promise<string[]>` | Default Chrome CLI args. |
| `trimCache` | `() => Promise<void>` | Remove old browser binaries from cache. |
| `lastLaunchedBrowser` | `() => Promise<SupportedBrowser>` | Name of last launched browser. |
| `defaultBrowser` | `() => Promise<SupportedBrowser>` | Default browser name (config-influenced, else `chrome`). |

### Browser

| Method | Signature | Description |
|--------|-----------|-------------|
| `newPage` | `(options?: CreatePageOptions) => Promise<Page>` | New page in default context. |
| `close` | `() => Promise<void>` | Closes browser + all pages. |
| `disconnect` | `() => Promise<void>` | Disconnects Puppeteer, leaves process running. |
| `createBrowserContext` | `(options?: BrowserContextOptions) => Promise<BrowserContext>` | Isolated context. |
| `browserContexts` | `() => BrowserContext[]` | Open contexts. |
| `defaultBrowserContext` | `() => BrowserContext` | Default context (can't close). |
| `pages` | `(includeAll?: boolean) => Promise<Page[]>` | Open pages across contexts. |
| `version` | `() => Promise<string>` | Browser version string. |
| `userAgent` | `() => Promise<string>` | Original UA. |
| `wsEndpoint` | `() => string` | WS endpoint URL. |
| `process` | `() => ChildProcess \| null` | null if connected via `connect`. |
| `target` | `() => Target` | Default context's target. |
| `targets` | `() => Target[]` | All active targets. |
| `waitForTarget` | `(predicate, options?) => Promise<Target>` | Wait for matching target. |
| `cookies` | `() => Promise<Cookie[]>` | Shortcut for defaultBrowserContext().cookies(). |
| `setCookie` | `(...cookies: CookieData[]) => Promise<void>` | Shortcut for defaultBrowserContext().setCookie(). |
| `deleteCookie` | `(...cookies: Cookie[]) => Promise<void>` | Shortcut for defaultBrowserContext().deleteCookie(). |
| `get connected` | `boolean` | Whether browser is connected. |

### BrowserContext

| Method | Signature | Description |
|--------|-----------|-------------|
| `newPage` | `(options?: CreatePageOptions) => Promise<Page>` | New page in this context. |
| `close` | `() => Promise<void>` | Close context (not default). |
| `pages` | `(includeAll?: boolean) => Promise<Page[]>` | Pages in this context. |
| `targets` | `() => Target[]` | Targets in this context. |
| `waitForTarget` | `(predicate, options?) => Promise<Target>` | Wait for target. |
| `cookies` | `() => Promise<Cookie[]>` | Get cookies. |
| `setCookie` | `(...cookies: CookieData[]) => Promise<void>` | Set cookies. |
| `deleteCookie` | `(...cookies: Cookie[]) => Promise<void>` | Delete cookies. |
| `deleteMatchingCookies` | `(...filters: DeleteCookiesRequest[]) => Promise<void>` | Delete matching cookies. |
| `setPermission` | `(origin, ...permissions) => Promise<void>` | Set permissions (replaces `overridePermissions`). |
| `clearPermissionOverrides` | `() => Promise<void>` | Clear permissions. |
| `browser` | `() => Browser` | Parent browser. |
| `get closed` | `boolean` | Is context closed. |
| `get id` | `string \| undefined` | Context ID. |

### Page (key methods for PDF generation)

#### Navigation & Content

| Method | Signature | Description |
|--------|-----------|-------------|
| `goto` | `(url: string, options?: GoToOptions) => Promise<HTTPResponse \| null>` | Navigate to URL. null for same-page navigation. |
| `reload` | `(options?: ReloadOptions) => Promise<HTTPResponse \| null>` | Reload page. |
| `goBack` | `(options?: WaitForOptions) => Promise<HTTPResponse \| null>` | Go back in history. |
| `goForward` | `(options?: WaitForOptions) => Promise<HTTPResponse \| null>` | Go forward in history. |
| `url` | `() => string` | Current URL. |
| **`setContent`** | `(html: string, options?: SetContentWaitForOptions) => Promise<void>` | **Set page HTML from string** — core method for HTML→PDF. `waitUntil` default 'load'. TS type excludes 'networkidle0'/'networkidle2' but CDP runtime honors them. |
| **`content`** | `() => Promise<string>` | Get full HTML including DOCTYPE. |
| `title` | `() => Promise<string>` | Page title. |
| `waitForNavigation` | `(options?: WaitForOptions) => Promise<HTTPResponse \| null>` | Wait for navigation. |
| `bringToFront` | `() => Promise<void>` | Bring tab to front. |
| `close` | `(options?: { runBeforeUnload?: boolean }) => Promise<void>` | Close page. |
| `isClosed` | `() => boolean` | Is page closed. |

#### Evaluation

| Method | Signature | Description |
|--------|-----------|-------------|
| **`evaluate`** | `<Params, Func>(pageFunction: Func \| string, ...args: Params) => Promise<Awaited<ReturnType<Func>>>` | **Execute JS in page context.** Returns serializable values by value; non-serializable returns undefined. Handles passed as referenced objects. |
| `evaluateHandle` | `<Params, Func>(pageFunction, ...args) => Promise<HandleFor<...>>` | Like evaluate but returns JSHandle/ElementHandle. |
| `evaluateOnNewDocument` | `<Params, Func>(pageFunction, ...args) => Promise<NewDocumentScriptEvaluation>` | Run on every navigation before other scripts. |
| `exposeFunction` | `(name: string, fn: Function) => Promise<void>` | Bind Node function to `window[name]`. |

#### Viewport & Emulation

| Method | Signature | Description |
|--------|-----------|-------------|
| **`setViewport`** | `(viewport: Viewport \| null) => Promise<void>` | Set viewport. null = reset to default. |
| `viewport` | `() => Viewport \| null` | Get current viewport. |
| `emulate` | `(device: Device) => Promise<void>` | Set UA + viewport together. |
| `emulateMediaType` | `(type?: string) => Promise<void>` | 'screen' \| 'print' \| null. **Call 'screen' before pdf() for screen-media colors.** |
| `emulateLocale` | `(locale?: string) => Promise<void>` | Emulate locale. |
| `emulateTimezone` | `(timezoneId?: string) => Promise<void>` | Emulate timezone. |
| `setJavaScriptEnabled` | `(enabled: boolean) => Promise<void>` | Enable/disable JS. |

#### Selectors & Waiting

| Method | Signature | Description |
|--------|-----------|-------------|
| **`waitForSelector`** | `<Selector>(selector, options?) => Promise<ElementHandle \| null>` | Wait for element. `visible`/`hidden` default false. timeout default 30000. |
| **`waitForFunction`** | `<Params, Func>(pageFunction, options?, ...args) => Promise<HandleFor<...>>` | Wait until function returns truthy. `polling`: 'raf' (default), 'mutation', or number (ms). |
| `waitForRequest` | `(urlOrPredicate, options?) => Promise<HTTPRequest>` | Wait for matching request. |
| `waitForResponse` | `(urlOrPredicate, options?) => Promise<HTTPResponse>` | Wait for matching response. |
| `waitForNetworkIdle` | `(options?) => Promise<void>` | Wait for network idle. `idleTime` default 500ms, `concurrency` default 0. |
| `$` | `(selector) => Promise<ElementHandle \| null>` | Query selector. |
| `$$` | `(selector, options?) => Promise<ElementHandle[]>` | Query all. |
| `$eval` | `(selector, fn, ...args) => Promise<...>` | Eval on first match. |
| `$$eval` | `(selector, fn, ...args) => Promise<...>` | Eval on all matches. |
| `locator` | `(selector) => Locator` | Create locator. |

#### PDF & Screenshots

| Method | Signature | Description |
|--------|-----------|-------------|
| **`pdf`** | `(options?: PDFOptions) => Promise<Uint8Array>` | **Generate PDF.** Uses 'print' CSS media by default. Always returns Uint8Array. If `path` set, also writes to disk. |
| `createPDFStream` | `(options?: PDFOptions) => Promise<ReadableStream<Uint8Array>>` | Streaming PDF variant. |
| **`screenshot`** | `(options?: ScreenshotOptions) => Promise<Uint8Array \| string>` | Take screenshot. Returns Uint8Array or base64 string. |
| `screencast` | `(options?) => Promise<ScreenRecorder>` | Video recording (requires ffmpeg). `@experimental` |

#### Resource Injection

| Method | Signature | Description |
|--------|-----------|-------------|
| `addScriptTag` | `(options: FrameAddScriptTagOptions) => Promise<ElementHandle<HTMLScriptElement>>` | Inject script (url/path/content). |
| `addStyleTag` | `(options) => Promise<ElementHandle<HTMLStyleElement \| HTMLLinkElement>>` | Inject CSS (url/path/content). |
| `setExtraHTTPHeaders` | `(headers: Record<string, string>) => Promise<void>` | Set extra HTTP headers. |
| **`setUserAgent`** | `(options: { userAgent?, userAgentMetadata?, platform? }) => Promise<void>` | Set user agent (object form — modern). |
| `setRequestInterception` | `(value: boolean) => Promise<void>` | Enable request interception. |
| `setCacheEnabled` | `(enabled?: boolean) => Promise<void>` | Enable/disable cache (default true). |
| `setOfflineMode` | `(enabled: boolean) => Promise<void>` | Toggle offline mode. |

---

## Events & Hooks

### Page Events (`PageEvent` enum)

| Event Key | String Value | Payload | Description |
|-----------|-------------|---------|-------------|
| `Close` | `'close'` | `undefined` | Page closed |
| `Console` | `'console'` | `ConsoleMessage` | Console API call |
| `DOMContentLoaded` | `'domcontentloaded'` | `undefined` | DOMContentLoaded fired |
| `Load` | `'load'` | `undefined` | Load event fired |
| `PageError` | `'pageerror'` | `Error \| unknown` | Uncaught exception in page |
| `Error` | `'error'` | `Error` | Page-level error |
| `Request` | `'request'` | `HTTPRequest` | Request issued |
| `Response` | `'response'` | `HTTPResponse` | Response received |
| `RequestFailed` | `'requestfailed'` | `HTTPRequest` | Request failed |
| `RequestFinished` | `'requestfinished'` | `HTTPRequest` | Request finished (body downloaded) |
| `RequestServedFromCache` | `'requestservedfromcache'` | `HTTPRequest` | Request served from cache |
| `FrameAttached` | `'frameattached'` | `Frame` | Frame attached |
| `FrameDetached` | `'framedetached'` | `Frame` | Frame detached |
| `FrameNavigated` | `'framenavigated'` | `Frame` | Frame navigated |
| `Dialog` | `'dialog'` | `Dialog` | JavaScript dialog (alert/confirm/prompt) |
| `Metrics` | `'metrics'` | `{ title, metrics }` | Page metrics update |
| `WorkerCreated` | `'workercreated'` | `WebWorker` | Dedicated worker created |
| `WorkerDestroyed` | `'workerdestroyed'` | `WebWorker` | Worker destroyed |
| `Popup` | `'popup'` | `Page \| null` | Popup page opened |
| `Issue` | `'issue'` | `Issue` | Web Compatibility issue `@experimental` |

### Browser Events (`BrowserEvent` enum)

| Event Key | String Value | Payload |
|-----------|-------------|---------|
| `Disconnected` | `'disconnected'` | `undefined` |
| `TargetChanged` | `'targetchanged'` | `Target` |
| `TargetCreated` | `'targetcreated'` | `Target` |
| `TargetDestroyed` | `'targetdestroyed'` | `Target` |

### BrowserContext Events (`BrowserContextEvent` enum)

| Event Key | String Value | Payload |
|-----------|-------------|---------|
| `TargetChanged` | `'targetchanged'` | `Target` |
| `TargetCreated` | `'targetcreated'` | `Target` |
| `TargetDestroyed` | `'targetdestroyed'` | `Target` |

### EventEmitter Pattern

All classes (`Browser`, `BrowserContext`, `Page`, `Frame`, `CDPSession`) extend `EventEmitter<TEvents>`:

```ts
// All return `this` (chainable)
on<Key>(type: Key, handler: Handler): this;       // Bind listener
once<Key>(type: Key, handler: Handler): this;     // Bind one-time listener
off<Key>(type: Key, handler?: Handler): this;     // Remove listener (omit handler = remove all for type)
emit<Key>(type: Key, event: ...): boolean;        // Returns true if listeners existed
listenerCount(type): number;
removeAllListeners(type?): this;
```

- Wildcard `'*'` supported as event type (matches all events)
- Supports `using` / `await using` disposal (`[Symbol.dispose]`, `[Symbol.asyncDispose]`)

**Usage:**
```ts
page.on('console', msg => console.log(msg.text()));
page.once('load', () => console.log('Page loaded'));
page.off('console', handler);

browser.on('disconnected', () => console.log('Browser closed'));
```

---

## Deprecations & Breaking Changes

### Removed in v25 (Breaking Changes from earlier versions)

| API | Status | Replacement |
|-----|--------|-------------|
| `Page.waitForTimeout(ms)` | **REMOVED** | Use native `new Promise(r => setTimeout(r, ms))` or `AbortSignal.timeout(ms)` |
| `Page.$x(expression)` / `Frame.$x(expression)` | **REMOVED** | Use xpath:: prefix in selectors: `page.$('xpath:://div')` |
| `headless: 'new'` | **REMOVED** (use `true` instead) | `headless: true` gives new headless mode |

### Deprecated APIs (still present but flagged @deprecated)

| API | Replacement | Notes |
|-----|-------------|-------|
| `Page.cookies(...urls)` | `Browser.cookies()` / `BrowserContext.cookies()` | Page-level cookie methods deprecated |
| `Page.setCookie(...cookies)` | `Browser.setCookie()` / `BrowserContext.setCookie()` | Same |
| `Page.deleteCookie(...cookies)` | `Browser.deleteCookie()` / `BrowserContext.deleteCookie()` | Same |
| `BrowserContext.overridePermissions(origin, permissions)` | `BrowserContext.setPermission(origin, ...permissions)` | Use `PermissionDescriptor` over `Permission` |
| `Page.setUserAgent(string, metadata)` (2-arg overload) | `Page.setUserAgent({ userAgent?, userAgentMetadata?, platform? })` (object form) | String overload deprecated |
| `Page.target()` | `Page.createCDPSession()` + `PageEvent.Popup` event | Target access deprecated |
| `HTTPRequest.postData()` | `HTTPRequest.fetchPostData()` | postData() returns undefined for large data |
| `Frame.name()` | `frameElement() + evaluate` | Name deprecated |
| `Frame.isDetached()` | `frame.detached` getter | Use the property |
| `Page.setDragInterception(enabled)` | ElementHandle drag APIs / Page.mouse | Drag interception no longer supported |
| `Page.isDragInterceptionEnabled()` | Same | Deprecated |
| `ElementHandle.dragEnter(data)` | Not needed | `dragenter` auto-performed during dragging |
| `ElementHandle.dragOver(data)` | Not needed | Same |
| `ElementHandle.drop(data)` | `ElementHandle.drop(element)` | DragPayload-based drop deprecated |
| `ElementHandle.dragAndDrop(target, options)` | `ElementHandle.drop(target)` | Deprecated |

### Headless Mode Changes
- **`headless: true`** (default) = modern "new headless" Chrome (full Chrome feature support)
- **`headless: 'shell'`** = old Chrome Headless Shell (smaller footprint, fewer features)
- ~~`headless: 'new'`~~ = REMOVED in v25 — use `true`
- `headless: false` = visible browser window (for debugging)

---

## Serverless Usage Pattern

### Package Choice
For serverless (Vercel/AWS Lambda), use **`puppeteer-core`** (not `puppeteer`) to:
- Avoid the ~140 MB Chromium download during `postinstall`
- Keep bundle size under platform limits (250 MB unzipped for Vercel Serverless Functions)
- Supply your own browser binary via `executablePath`

### @sparticuz/chromium Integration
`@sparticuz/chromium` is ~NOT installed in this repo. Standard pattern when adding:

```ts
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const browser = await puppeteer.launch({
  args: chromium.args,                        // Curated serverless flags
  executablePath: await chromium.executablePath(),  // Path to packaged binary (extracted to /tmp)
  headless: chromium.headless,               // typically true
  defaultViewport: chromium.defaultViewport,  // usually { width: 1200, height: 800 } or null
});
```

`@sparticuz/chromium` ships a minified Chromium (~50 MB brotli'd) tailored for Lambda. It auto-extracts the binary to `/tmp` on cold start.

### Common Serverless Chrome Args
These go to the Chrome process (via `args: [...]`), not to Puppeteer:

| Arg | Purpose |
|-----|---------|
| `--no-sandbox` | Disables Linux SUID sandbox; required in containers/Lambda lacking privileges |
| `--disable-setuid-sandbox` | Disables setuid sandbox helper (pair with --no-sandbox) |
| `--single-process` | Single process mode — lower memory, no separate renderers (less stable) |
| `--no-zygote` | Disables zygote process — reduces spawning memory (pair with --single-process) |
| `--disable-gpu` | Disables GPU acceleration (no GPU in serverless) |
| `--disable-dev-shm-usage` | Avoids /dev/shm (tiny in Lambda) — falls back to /tmp. Critical for stability. |
| `--font-render-hinting=none` | Improves font rendering consistency in headless containers |

### Vercel-Specific Considerations

1. **Bundle size**: Use `puppeteer-core` + `@sparticuz/chromium` (~50 MB) instead of `puppeteer` (~140 MB download).
2. **maxDuration**: PDF generation takes 5–10 s. Set `maxDuration` in `vercel.json` per-route:
   ```json
   {
     "functions": {
       "api/render-pdf": { "maxDuration": 60, "memory": 1024 }
     }
   }
   ```
   - Hobby max: 60 s, Pro/Enterprise: up to 800 s.
3. **Cold starts**: Browser launch dominates latency. For steady-state, **reuse a single browser** across requests and open/close pages per request rather than launching per request.
4. **Memory**: Chrome is memory-hungry. Set `memory: 1024` (MB) or higher for PDF routes.

### Environment Variables / Configuration
**File:** `puppeteer-core/lib/puppeteer/common/Configuration.d.ts`

| Config Key | Env Var | Default | Purpose |
|------------|---------|---------|---------|
| `cacheDirectory` | `PUPPETEER_CACHE_DIR` | `~/.cache/puppeteer` | Where browser binaries cached |
| `executablePath` | `PUPPETEER_EXECUTABLE_PATH` | auto-computed | Override browser path |
| `defaultBrowser` | `PUPPETEER_BROWSER` | `chrome` | Default browser type |
| `temporaryDirectory` | `PUPPETEER_TMP_DIR` | `os.tmpdir()` | Temp dir |
| `skipDownload` | `PUPPETEER_SKIP_DOWNLOAD` | — | Skip download in install.mjs |
| `chrome.skipDownload` | `PUPPETEER_CHROME_SKIP_DOWNLOAD` | — | Skip Chrome download only |

### defaultViewport
- **Default**: `{ width: 800, height: 600 }` (`DEFAULT_VIEWPORT` constant in `common/util.js`)
- **`null`**: Disables the default viewport entirely — no 800×600 imposition. Recommended for PDF generation where page size is governed by `@page` CSS or `pdf()` options.
- During launch: `defaultViewport: null` prevents the default viewport from being applied.

---

## PDF Generation Reference

### `page.pdf(options?: PDFOptions): Promise<Uint8Array>`

Generates a PDF of the current page using Chrome's `Page.printToPDF` CDP command.

**Key behavior:**
- Uses `print` CSS media type by default. Call `page.emulateMediaType('screen')` first for screen-media colors.
- **Always returns `Promise<Uint8Array>`** (PDF bytes). If `path` is set, also writes to disk — does NOT return undefined.
- Background colors require either `printBackground: true` in options OR CSS `-webkit-print-color-adjust: exact` (or `print-color-adjust: exact`).
- `waitForFonts: true` (default) — automatically waits for `document.fonts.ready` before printing. May require `page.bringToFront()` if page is backgrounded.

### Option Priority (page size)

1. **`preferCSSPageSize: true`** → CSS `@page { size: ... }` rule takes priority over everything
2. **`format`** → If set, takes priority over `width`/`height`
3. **`width` + `height`** → Used if `format` is not set
4. **Default**: `'letter'` (8.5×11in)

### Units for width/height/margins
Accept a **number** (CSS pixels) or a **string with unit**: `px`, `mm`, `cm`, `in`.

Examples: `'210mm'`, `'21cm'`, `'8.5in'`, `'842px'`, or `842` (bare = pixels).

### Margins (PDFMargin)
```ts
margin: {
  top: '0.4in',       // or '10mm', '72px', 40 (px)
  bottom: '0.4in',
  left: '0.4in',
  right: '0.4in',
}
```
Default: `undefined` = no margins. Set to `0` explicitly for zero margins.

### Header/Footer Templates
Set `displayHeaderFooter: true` and provide `headerTemplate` / `footerTemplate` HTML strings. Available CSS classes for injecting values:

| Class | Value |
|-------|-------|
| `date` | Formatted print date |
| `title` | Document title |
| `url` | Document URL |
| `pageNumber` | Current page number |
| `totalPages` | Total page count |

Example:
```html
<div style="font-size:9px; width:100%; text-align:center;">
  Page <span class="pageNumber"></span> of <span class="totalPages"></span>
</div>
```

**Note:** Header/footer render in a separate tiny viewport; inline styles are recommended since external CSS doesn't reliably apply.

### scale (0.1 – 2.0)
Uniform scale of the rendered webpage in the printout. Default 1. Affects content layout, not paper size. Values outside [0.1, 2.0] cause an error.

### omitBackground
When `true`, hides the default white background → transparent PDF. Pair with `printBackground: false`.

### preferCSSPageSize: true
When `true`, a CSS `@page` size/margin rule overrides `format`/`width`/`height`/`margin` options:
```css
@page {
  size: A4 landscape;
  margin: 0;
}
```
Then: `page.pdf({ preferCSSPageSize: true, printBackground: true })`

### Internal pdf() Flow (from cdp/Page.js source)
```js
// 1. Parse options, apply defaults
// 2. If omitBackground, set transparent background color
// 3. If waitForFonts (default true), evaluate document.fonts.ready with timeout race
// 4. Call CDP Page.printToPDF with all options (transferMode: ReturnAsStream)
// 5. Read the stream into Uint8Array
// 6. If path set, fs.writeFileSync(path, buffer)
// 7. Return Uint8Array
```

---

## Usage Examples

### Basic HTML String → PDF (local dev with puppeteer)

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: null,  // Disable 800×600 default
});

const page = await browser.newPage();

// Set viewport for rendering (CSS pixels)
await page.setViewport({ width: 1200, height: 850, deviceScaleFactor: 2 });

// Inject HTML
await page.setContent(htmlString, {
  waitUntil: 'networkidle0',  // Wait for all network activity to settle
  timeout: 30000,
});

// Generate PDF
const pdfBytes: Uint8Array = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,   // Honor @page CSS rule
  timeout: 30000,
});

await browser.close();
// pdfBytes is a Uint8Array of the PDF file
```

### Serverless Pattern with @sparticuz/chromium (Vercel)

```ts
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function generateCertificate(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 850, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      preferCSSPageSize: true,
      timeout: 30000,
    });

    return pdfBytes;
  } finally {
    await browser.close();
  }
}
```

### Custom Page Size (non-standard dimensions)

```ts
// Landscape certificate, 11×8.5 inches
const pdfBytes = await page.pdf({
  width: '11in',
  height: '8.5in',
  printBackground: true,
  landscape: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  timeout: 30000,
});
```

### Using CSS @page Rule

HTML:
```html
<style>
  @page {
    size: A4 landscape;
    margin: 10mm 15mm;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
```

JS:
```ts
await page.setContent(html, { waitUntil: 'networkidle0' });
const pdfBytes = await page.pdf({
  preferCSSPageSize: true,
  printBackground: true,
});
```

### Embedding Custom Fonts (Arabic certificate support)

```ts
// Approach A: Google Fonts via <link> in HTML (requires networkidle0)
const html = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
  <div style="font-family: 'Amiri', serif;">شهادة</div>
`;

// Approach B: Base64-embedded @font-face (no network dependency — better for serverless)
const html = `
  <style>
    @font-face {
      font-family: 'Amiri';
      src: url('data:font/woff2;base64,...') format('woff2');
      font-weight: 400;
    }
  </style>
  <div style="font-family: 'Amiri', serif;">شهادة</div>
`;
```

**Note:** `page.pdf({ waitForFonts: true })` (default) automatically waits for `document.fonts.ready` before printing — no need for a separate `page.evaluate(() => document.fonts.ready)`.

### Browser Reuse (for serverless cold start optimization)

```ts
// Global browser instance — reuse across requests
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.connected) {
    _browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: null,
    });
  }
  return _browser;
}

async function generatePDF(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();  // Open a new page per request
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally {
    await page.close();  // Close the page, not the browser
  }
}
```

### Evaluating JS in Page Context

```ts
// Get computed style of an element
const color = await page.evaluate(() => {
  const el = document.querySelector('.certificate-title');
  return getComputedStyle(el).color;
});

// Wait for a specific condition
await page.waitForFunction(
  () => document.querySelector('.signature-img')?.complete === true,
  { timeout: 10000 }
);
```

### Vercel API Route Example

```ts
// app/api/certificates/render/route.ts
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(request: Request) {
  const { html } = await request.json();

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      timeout: 30000,
    });

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="certificate.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}
```

---

## Gotchas & Warnings

### Critical for Certificate Generation

1. **`pdf()` returns `Promise<Uint8Array>`, NOT `Buffer`.** Use `Buffer.from(pdfBytes)` if you need a Node Buffer (e.g., for streaming).

2. **`printBackground: true` is REQUIRED for background colors/images.** Without it, Chrome strips all background colors for print media. Also add CSS `-webkit-print-color-adjust: exact` / `print-color-adjust: exact` on elements with backgrounds.

3. **`defaultViewport: null` at launch** — Disables the 800×600 default viewport that can clip wide certificate templates. Set your own viewport with `page.setViewport()`.

4. **`setContent` `waitUntil` TS type restricts `networkidle0`/`networkidle2`** in the TypeScript definitions, but the CDP runtime actually honors them. Use `'networkidle0'` to wait for CDN fonts/images to load before generating PDF. A type assertion may be needed: `waitUntil: 'networkidle0' as any`.

5. **`waitForFonts: true` is the default in `pdf()`** — automatically waits for `document.fonts.ready`. No need for a separate font wait `evaluate()`. Set to `false` only if you want to skip font waiting.

6. **Viewport does NOT control PDF page size.** The viewport only affects how content lays out. The PDF page size is governed by `@page` CSS rule (with `preferCSSPageSize: true`) or the `pdf()` options (`format`/`width`/`height`).

7. **`format` takes priority over `width`/`height`.** If you set `format: 'A4'` AND `width: '11in'`, the A4 size wins. To use custom dimensions, omit `format` entirely.

8. **`preferCSSPageSize: true` wins over ALL other size options.** Use this when your HTML/CSS `@page` rule should control page dimensions.

9. **`headless: 'shell'` uses the old Chrome Headless Shell** — smaller footprint but missing some features. For certificate generation, `headless: true` (modern) is recommended for full feature support (custom fonts, CSS, etc.).

### Serverless Gotchas

10. **Use `puppeteer-core` (not `puppeteer`) on serverless.** The `puppeteer` package's `postinstall` downloads ~140 MB which bloats the bundle and slows builds.

11. **`--disable-dev-shm-usage` is critical** — `/dev/shm` in serverless environments is tiny (often 64 MB). Chrome crashes without this flag; it falls back to `/tmp`.

12. **Cold start latency is dominated by browser launch.** Reuse a single `browser` instance across requests and open/close `page` per request. But always handle `browser.connected === false` (browser may crash).

13. **Vercel `maxDuration` must be set** for PDF routes — default is 10 s which may not be enough. Set to 60 s minimum.

14. **Memory allocation: set to 1024 MB minimum** for PDF routes — Chrome is memory-hungry and PDF generation with large/complex certificates can OOM at 512 MB.

15. **`page.bringToFront()` may be needed** if the page is backgrounded during `pdf()` — `waitForFonts` (default true) waits for `document.fonts.ready` which may hang if the page isn't visible.

### TypeScript

16. **ESM only.** `"type": "module"` in package.json. Use `import puppeteer from 'puppeteer'` (not `require()`).

17. **`node >= 22.12.0` required.** The Babel target in this project uses Bun, so verify Bun's Node compatibility.

18. **No `@types/puppeteer` needed.** Types are bundled in `puppeteer-core/lib/puppeteer/**/*.d.ts`.

19. **`evaluate()` function closures are NOT allowed.** You cannot reference outer variables inside `evaluate()` — they must be passed via `...args` and must be serializable. Non-serializable values return `undefined` (use `evaluateHandle` for handles).

20. **`waitForTimeout` is REMOVED.** If you need a delay, use:
    ```ts
    await new Promise(resolve => setTimeout(resolve, 1000));
    // or
    await new Promise(resolve => setTimeout(resolve, 1000, undefined));
    ```

21. **`$x(expression)` is REMOVED.** Use xpath prefix:
    ```ts
    // Old: page.$x('//div[@class="cert"]')
    // New:
    const handle = await page.$('xpath:://div[@class="cert"]');
    ```

### Memory & Cleanup

22. **Always close the browser in a `finally` block** to prevent zombie Chrome processes in serverless environments. Use `try { ... } finally { await browser.close(); }`.

23. **`browser.close()` kills the process. `browser.disconnect()` leaves it running** — useful if you connect to a persistent browser instance.

24. **Pages should be closed per-request** when reusing a browser: `await page.close()` in the `finally` block.

25. **EventEmitter supports `using` / `await using` disposal:**
    ```ts
    await using browser = await puppeteer.launch();  // auto-closes on scope exit
    using page = await browser.newPage();              // auto-closes on scope exit
    ```
