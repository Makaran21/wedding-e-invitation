interface ImportMetaEnv {
  /** "false" hides the gold progress line along the bottom of the screen during the main animations. */
  readonly PUBLIC_ANIMATION_PROGRESS?: string;
  /** "false" hides the compact section dock at the bottom of the screen. */
  readonly PUBLIC_NAVBAR?: string;
  /** Where the dock sits: "right" (default) or "bottom". */
  readonly PUBLIC_NAVBAR_POSITION?: 'right' | 'bottom';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
