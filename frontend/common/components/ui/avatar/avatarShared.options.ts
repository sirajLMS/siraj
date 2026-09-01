/** Scaffold options for {@link BaseAvatarScaffold}, kept in their own module so the
 * component files stay `react-refresh`-compliant (components-only exports). */
export interface BaseAvatarScaffoldOptions {
  /** Default avatar pixel size when the `size` prop is not explicitly passed. */
  readonly defaultSize?: number;
  /** When true, circular avatars receive a 1px divider outline (mobile tier). */
  readonly showCircularOutline?: boolean;
}

export const DEFAULT_DESKTOP_AVATAR_OPTIONS: BaseAvatarScaffoldOptions = {
  defaultSize: 40,
  showCircularOutline: false,
};

export const DEFAULT_MOBILE_AVATAR_OPTIONS: BaseAvatarScaffoldOptions = {
  defaultSize: 36,
  showCircularOutline: true,
};
