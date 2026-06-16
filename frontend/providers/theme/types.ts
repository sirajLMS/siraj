import type { PaletteColor, PaletteColorOptions, TypeBackground } from "@mui/material/styles";

export type TonalPalette = {
  0: string;
  5: string;
  10: string;
  15: string;
  20: string;
  25: string;
  30: string;
  35: string;
  40: string;
  50: string;
  60: string;
  70: string;
  80: string;
  90: string;
  95: string;
  98: string;
  99: string;
  100: string;
};

/**
 * M3 Siblings (excluding the base color)
 */
export type M3ColorSiblings<T extends string> = {
  [K in `on${Capitalize<T>}`]: string;
} & {
  [K in `${T}Container`]: string;
} & {
  [K in `on${Capitalize<T>}Container`]: string;
};

/**
 * Optional M3 Siblings for PaletteOptions
 */
export type M3ColorSiblingsOptions<T extends string> = {
  [K in `on${Capitalize<T>}`]?: string;
} & {
  [K in `${T}Container`]?: string;
} & {
  [K in `on${Capitalize<T>}Container`]?: string;
};

/**
 * Generates Material 3 Color Family properties for a given name.
 */
export type ColorFamily<T extends string> = {
  [K in T]: string;
} & M3ColorSiblings<T>;

/**
 * Optional version of ColorFamily for PaletteOptions
 */
export type ColorFamilyOptions<T extends string> = {
  [K in T]?: string;
} & M3ColorSiblingsOptions<T>;

/**
 * Material 3 Base Scheme properties (Surface, Outline, etc.)
 */
export interface M3BaseScheme {
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

export type M3BaseSchemeOptions = Partial<Omit<M3BaseScheme, "background">> & {
  background?: Partial<TypeBackground>;
};

declare module "@mui/material/styles" {
  interface Theme {
    layout: {
      pageMargin: string;
      gutter: string;
      authWidth: string;
      sidebarWidth: string;
      navbarHeight: string;
      cardPadding: string;
      inputGap: string;
      sectionGap: string;
      radius: {
        card: number;
        button: number;
        badge: number;
        section: number;
      };
    };
  }

  interface ThemeOptions {
    layout?: {
      pageMargin?: string;
      gutter?: string;
      authWidth?: string;
      sidebarWidth?: string;
      navbarHeight?: string;
      cardPadding?: string;
      inputGap?: string;
      sectionGap?: string;
      radius?: {
        card?: number;
        button?: number;
        badge?: number;
        section?: number;
      };
    };
  }

  interface Palette
    extends M3ColorSiblings<"primary">,
      M3ColorSiblings<"secondary">,
      M3ColorSiblings<"error">,
      M3ColorSiblings<"warning">,
      M3ColorSiblings<"info">,
      M3ColorSiblings<"success">,
      ColorFamily<"tertiary">,
      ColorFamily<"header">,
      ColorFamily<"footer">,
      ColorFamily<"sidebar">,
      Omit<M3BaseScheme, "background"> {
    // MUI Standard families remain objects
    primary: PaletteColor;
    secondary: PaletteColor;
    error: PaletteColor;
    warning: PaletteColor;
    info: PaletteColor;
    success: PaletteColor;

    // MUI Background override
    background: TypeBackground;

    // Layout Helpers (Restored)
    border: {
      light: string;
      main: string;
    };
    shadow: {
      card: string;
      cardHover: string;
      button: string;
      buttonHover: string;
    };

    status: ColorFamily<"pending"> &
      ColorFamily<"confirmed"> &
      ColorFamily<"active"> &
      ColorFamily<"completed"> &
      ColorFamily<"cancelled"> &
      ColorFamily<"blocked">;
  }

  interface PaletteOptions
    extends M3ColorSiblingsOptions<"primary">,
      M3ColorSiblingsOptions<"secondary">,
      M3ColorSiblingsOptions<"error">,
      M3ColorSiblingsOptions<"warning">,
      M3ColorSiblingsOptions<"info">,
      M3ColorSiblingsOptions<"success">,
      ColorFamilyOptions<"tertiary">,
      ColorFamilyOptions<"header">,
      ColorFamilyOptions<"footer">,
      ColorFamilyOptions<"sidebar">,
      M3BaseSchemeOptions {
    // Force standard families to be objects in PaletteOptions
    primary?: PaletteColorOptions;
    secondary?: PaletteColorOptions;
    error?: PaletteColorOptions;
    warning?: PaletteColorOptions;
    info?: PaletteColorOptions;
    success?: PaletteColorOptions;

    // MUI Background override
    background?: Partial<TypeBackground>;

    // Layout Helpers (Restored)
    border?: {
      light?: string;
      main?: string;
    };
    shadow?: {
      card?: string;
      cardHover?: string;
      button?: string;
      buttonHover?: string;
    };

    status?: ColorFamilyOptions<"pending"> &
      ColorFamilyOptions<"confirmed"> &
      ColorFamilyOptions<"active"> &
      ColorFamilyOptions<"completed"> &
      ColorFamilyOptions<"cancelled"> &
      ColorFamilyOptions<"blocked">;
  }

  // Extend Typography configurations to natively handle Design System variants
  interface TypographyVariants {
    display: React.CSSProperties;
    headlineLg: React.CSSProperties;
    headlineMd: React.CSSProperties;
    titleLg: React.CSSProperties;
    bodyLg: React.CSSProperties;
    bodyMd: React.CSSProperties;
    labelMd: React.CSSProperties;
    labelSm: React.CSSProperties;
    labelUppercase: React.CSSProperties;
    buttonText: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    display?: React.CSSProperties;
    headlineLg?: React.CSSProperties;
    headlineMd?: React.CSSProperties;
    titleLg?: React.CSSProperties;
    bodyLg?: React.CSSProperties;
    bodyMd?: React.CSSProperties;
    labelMd?: React.CSSProperties;
    labelSm?: React.CSSProperties;
    labelUppercase?: React.CSSProperties;
    buttonText?: React.CSSProperties;
  }
}

// Add Custom variants to typography component options
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display: true;
    headlineLg: true;
    headlineMd: true;
    titleLg: true;
    bodyLg: true;
    bodyMd: true;
    labelMd: true;
    labelSm: true;
    labelUppercase: true;
    buttonText: true;
  }
}
