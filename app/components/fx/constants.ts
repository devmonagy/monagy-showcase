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

// The "opens in a new tab" arrow used by every external link on the site.
//
// U+2197 alone is not safe to ship. It carries Emoji=Yes in Unicode, and
// although its DEFAULT presentation is text, iOS and Android both override
// that and substitute the full-color emoji glyph — so the same character
// that renders as a thin monoline arrow matching the type on desktop turns
// into a blue-and-white emoji tile on a phone.
//
// U+FE0E (VARIATION SELECTOR-15) is the explicit "render the text form"
// request, and it pins the glyph to the monoline arrow on every platform.
//
// Exported as a named constant rather than pasted inline at each call site
// precisely BECAUSE the selector is invisible in source: written literally
// it looks like a bare arrow, so any future edit could silently drop it and
// quietly bring the emoji back on mobile with nothing to see in the diff.
// One name, one place, one explanation.
// Written as escape sequences, not literal glyphs, for the same reason:
// U+FE0E has no visible form, so a copy-paste or a re-encode could drop
// it without leaving a trace in the diff. As escapes, both code points
// are legible as source and survive any editor.
export const ARROW_NE = "\u2197\uFE0E";
