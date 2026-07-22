/**
 * Shared viewport presets used across mobile stories.
 *
 * The exact `mobile1` / `mobile2` / `tablet` / `desktop` viewport map is
 * duplicated verbatim in ~30 mobile story files (Sonar cluster 1). Import it
 * from this single source of truth instead.
 */
export interface MobileViewportEntry {
  readonly name: string;
  readonly styles: { readonly width: string; readonly height: string };
}

export const MOBILE_VIEWPORTS: Record<string, MobileViewportEntry> = {
  mobile1: {
    name: "Mobile (375px)",
    styles: { width: "375px", height: "667px" },
  },
  mobile2: {
    name: "Mobile Large (414px)",
    styles: { width: "414px", height: "896px" },
  },
  tablet: {
    name: "Tablet (768px)",
    styles: { width: "768px", height: "1024px" },
  },
  desktop: {
    name: "Desktop (1280px)",
    styles: { width: "1280px", height: "800px" },
  },
};

/**
 * Standard `parameters.viewport` block for mobile stories. Spreads cleanly:
 * ```ts
 * parameters: { viewport: mobileViewportParams }
 * ```
 */
export const mobileViewportParams = {
  defaultViewport: "mobile1",
  viewports: MOBILE_VIEWPORTS,
} as const;

/**
 * Override of `mobileViewportParams` for stories that just want the default
 * viewport without restating the viewport map.
 */
export const mobileDefaultViewportOnly = {
  defaultViewport: "mobile1",
} as const;

export interface MobileStoryMetaOptions {
  readonly tags?: readonly string[];
  readonly layout?: "fullscreen" | "padded" | "centered";
  readonly defaultViewport?: string;
}

type StoryMetaObject<TComponent> = Record<string, unknown> & {
  readonly title: string;
  readonly component: TComponent;
  readonly tags: string[];
};

function buildTags(options: { readonly tags?: readonly string[] }): string[] {
  return ["ai-generated", ...(options.tags ?? [])];
}

/**
 * Builds a Storybook `Meta` base for a mobile component story, applying the
 * standard viewport parameters and the `ai-generated` tag. Returns a plain
 * object intended to be spread into the calling story's `Meta` literal;
 * callers use `satisfies Meta<typeof X>` at the call site (per the existing
 * convention in this codebase) for type safety.
 */
export function createMobileStoryMeta<TComponent>(
  component: TComponent,
  title: string,
  options: MobileStoryMetaOptions = {}
): StoryMetaObject<TComponent> {
  return {
    title,
    component,
    tags: buildTags(options),
    parameters: {
      viewport: {
        defaultViewport: options.defaultViewport ?? "mobile1",
        viewports: MOBILE_VIEWPORTS,
      },
      ...(options.layout ? { layout: options.layout } : {}),
    },
  };
}

/**
 * Builds a Storybook `Meta` base for a desktop component story — no viewport
 * parameters (desktop defaults), just the `ai-generated` tag.
 */
export function createDesktopStoryMeta<TComponent>(
  component: TComponent,
  title: string,
  options: { readonly tags?: readonly string[]; readonly layout?: "fullscreen" | "padded" | "centered" } = {}
): StoryMetaObject<TComponent> {
  return {
    title,
    component,
    tags: buildTags(options),
    ...(options.layout ? { parameters: { layout: options.layout } } : {}),
  };
}
