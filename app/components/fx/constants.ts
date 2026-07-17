// Glyphs cycled during every scramble/decode effect site-wide — deliberately
// terminal/HUD flavored (brackets, slashes, binary) rather than plain
// alphanumerics, to read as "decoding a transmission" instead of a generic
// shuffle. Single source of truth: DescriptionReveal's popover and every
// ScrambleLabel share this set, so the effect reads as one system wherever
// it appears.
export const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#01";
