interface ImportMetaEnv {
  /** "false" hides the gold progress line along the bottom of the screen during the main animations. */
  readonly PUBLIC_ANIMATION_PROGRESS?: string;
  /** "false" hides the compact section dock at the bottom of the screen. */
  readonly PUBLIC_NAVBAR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
