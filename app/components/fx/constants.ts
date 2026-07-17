// Glyphs cycled during every scramble/decode effect site-wide — deliberately
// terminal/HUD flavored (brackets, slashes, binary) rather than plain
// alphanumerics, to read as "decoding a transmission" instead of a generic
// shuffle. Single source of truth: DescriptionReveal's popover and every
// ScrambleLabel share this set, so the effect reads as one system wherever
// it appears.
export const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#01";

// The "signal locks into place" CustomEase curve — fast attack, ~11%
// overshoot around 40%, long settle. Shared by the hero name's entrance
// and the contact section's "Let's Talk." so the site's opening and
// closing beats speak the same mechanical-snap language. Each consumer
// calls CustomEase.create("signalLock", SIGNAL_LOCK_EASE) itself —
// re-creating the same id with the same curve is harmless, and it keeps
// either component working standalone.
export const SIGNAL_LOCK_EASE =
  "M0,0 C0.19,0.62 0.26,1.1 0.42,1.11 0.61,1.12 0.79,1 1,1";
