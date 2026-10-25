interface ImportMetaEnv {
  /** "true" shows a progress bar at the bottom of the screen while the main animations play. */
  readonly PUBLIC_ANIMATION_PROGRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
