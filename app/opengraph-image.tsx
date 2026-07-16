import { ImageResponse } from "next/og";
import {
  BRAND,
  gridBackground,
  glowOrbStyle,
  loadGoogleFont,
} from "./_brand/shared";
import { SITE } from "./data/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} — Software Developer Portfolio`;

// The marquee band's repeating words — same trio as the hero's ghost strip.
const BAND_WORDS = [
  "DEVELOPER",
  "ENGINEER",
  "CREATOR",
  "DEVELOPER",
  "ENGINEER",
  "CREATOR",
];

// Font subsetting: each request must cover every glyph that weight renders.
const SYNE_800_TEXT = "MOHAMEDNAGY.DEVELOPERENGINEERCREATOR";
const SYNE_700_TEXT = SITE.tagline;
const MONO_TEXT =
  "MN.SYS NYC // PORTFOLIO · SELECT FREELANCE SOFTWARE DEVELOPER monagy.com";

// Hollow "outline" type, Satori-style. The bundled @vercel/og in this Next
// version silently drops -webkit-text-stroke (all syntaxes), renders only
// the first ~4 entries of a text-shadow list, AND misplaces negative
// shadow offsets — all verified with rendered probes. What it renders
// completely and correctly is zero-offset blurred shadows, so the site's
// signature outlined ghost typography becomes a neon ring instead: fill
// the glyphs with the surface color and stack tight zero-offset blurs
// (dense crisp edge) plus one faint wide halo (the neon glow).
function neonRing(color: string, halo: string): string {
  return `0 0 2px ${color}, 0 0 2px ${color}, 0 0 3px ${color}, 0 0 12px ${halo}`;
}

// Preloader-style diagnostic segment bar: mostly-lit volt trail with a cyan
// "read head" — the boot screen's signature detail, reused as a footer motif.
const SEGMENT_COUNT = 14;
const SEGMENTS_LIT = 9;

export default async function OpengraphImage() {
  const [syne800, syne700, mono700] = await Promise.all([
    loadGoogleFont("Syne", 800, SYNE_800_TEXT),
    loadGoogleFont("Syne", 700, SYNE_700_TEXT),
    loadGoogleFont("JetBrains Mono", 700, MONO_TEXT),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BRAND.bg,
          overflow: "hidden",
        }}
      >
        <div style={gridBackground} />
        <div
          style={glowOrbStyle({
            color: "rgba(214,255,63,0.30)",
            size: 700,
            top: -260,
            left: -200,
          })}
        />
        <div
          style={glowOrbStyle({
            color: "rgba(51,232,255,0.26)",
            size: 640,
            bottom: -260,
            right: -180,
          })}
        />
        <div
          style={glowOrbStyle({
            color: "rgba(139,92,246,0.18)",
            size: 460,
            top: 40,
            right: 140,
          })}
        />

        {/* Ghost wordmark — huge, faint, bleeding off the top-right like the
            hero's ghost strip. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -48,
            top: -84,
            fontFamily: "Syne",
            fontWeight: 800,
            fontSize: 400,
            lineHeight: 1,
            letterSpacing: -10,
            color: "rgba(247,247,245,0.05)",
          }}
        >
          MN.
        </div>

        {/* Dashed orbit ring — cyan, overlapping the ghost mark */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 60,
            right: 210,
            width: 168,
            height: 168,
            borderRadius: "50%",
            border: "2px dashed rgba(51,232,255,0.5)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 130,
            right: 368,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: BRAND.cyan,
            boxShadow: "0 0 18px rgba(51,232,255,0.9)",
          }}
        />

        {/* Floating accent shards — same trio as Backdrop3D's */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 292,
            right: 128,
            width: 18,
            height: 18,
            background: BRAND.volt,
            boxShadow: "0 0 22px rgba(214,255,63,0.8)",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 226,
            right: 330,
            width: 9,
            height: 32,
            background: "rgba(139,92,246,0.6)",
            transform: "rotate(24deg)",
          }}
        />

        {/* Hairline plate frame — poster trim */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 18,
            left: 18,
            right: 18,
            bottom: 18,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        />

        {/* ============ Content column ============ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "46px 72px 42px",
          }}
        >
          {/* Corner HUD tags — same as the preloader's boot screen */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: BRAND.volt,
                  boxShadow: `0 0 14px ${BRAND.volt}`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: BRAND.volt,
                }}
              >
                MN.SYS
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: BRAND.textMuted,
              }}
            >
              NYC // PORTFOLIO
            </div>
          </div>

          {/* Name block: solid line + hollow outline line — the site's
              signature typographic duality */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 44,
                  height: 3,
                  background: BRAND.volt,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: 7,
                  textTransform: "uppercase",
                  color: BRAND.volt,
                }}
              >
                Software Developer
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Syne",
                fontWeight: 800,
                fontSize: 108,
                lineHeight: 0.95,
                letterSpacing: -4,
                color: BRAND.textContrast,
              }}
            >
              MOHAMED
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 9,
                fontFamily: "Syne",
                fontWeight: 800,
                fontSize: 108,
                lineHeight: 0.95,
              }}
            >
              {/* One element per letter, with a gap wider than the ring's
                  tight core: within a single text run, each glyph's
                  surface-colored fill knocks a notch out of any neighboring
                  ring it overlaps (Syne's kerned diagonal pairs overlap even
                  with generous letter-spacing). Separate elements with a 9px
                  gap keep every ring intact. */}
              {"NAGY".split("").map((ch, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    color: BRAND.bg,
                    textShadow: neonRing(BRAND.volt, "rgba(214,255,63,0.45)"),
                  }}
                >
                  {ch}
                </div>
              ))}
              <div style={{ display: "flex", color: BRAND.volt }}>.</div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontFamily: "Syne",
                fontWeight: 700,
                fontSize: 28,
                lineHeight: 1.2,
                color: BRAND.cyan,
              }}
            >
              {SITE.tagline}
            </div>
          </div>

          {/* Spacer pushes the footer to the plate's bottom edge; the tilted
              band below is absolutely positioned in the gap this leaves. */}
          <div style={{ display: "flex", flexGrow: 1 }} />

          {/* Footer: diagnostic segment bar + url */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
                  const lit = i < SEGMENTS_LIT;
                  const leading = i === SEGMENTS_LIT - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        width: 9,
                        height: 20,
                        borderRadius: 2,
                        background: lit
                          ? leading
                            ? BRAND.cyan
                            : BRAND.volt
                          : "transparent",
                        border: lit
                          ? "1px solid transparent"
                          : "1px solid rgba(255,255,255,0.18)",
                        boxShadow: leading
                          ? "0 0 12px rgba(51,232,255,0.9)"
                          : lit
                            ? "0 0 6px rgba(214,255,63,0.5)"
                            : "none",
                      }}
                    />
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 700,
                  fontSize: 26,
                  letterSpacing: 1,
                  color: BRAND.textContrast,
                }}
              >
                monagy.com
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: BRAND.textMuted,
              }}
            >
              NYC · Select Freelance
            </div>
          </div>
        </div>

        {/* ============ Tilted volt marquee band ============
            The site's most recognizable element: a full-bleed diagonal volt
            slab with alternating solid-ink and hollow-outline uppercase
            words, diamond separators built from rotated divs (no glyph
            dependency). Sits between the tagline and the footer bar. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: -80,
            bottom: 116,
            width: 1400,
            flexDirection: "row",
            alignItems: "center",
            gap: 30,
            padding: "15px 40px",
            background: BRAND.volt,
            boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
            transform: "rotate(-3deg)",
          }}
        >
          {BAND_WORDS.map((word, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 30,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Syne",
                  fontWeight: 800,
                  fontSize: 38,
                  letterSpacing: -1,
                  // Solid ink vs. translucent ink — the site's marquee
                  // alternates solid/outline, but the faked shadow-outline
                  // ghosts visibly at this glyph size, so the alternation
                  // is tonal here instead: same rhythm, crisp edges.
                  color: i % 2 === 0 ? BRAND.voltInk : "rgba(10,14,2,0.38)",
                }}
              >
                {word}
              </div>
              <div
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  background: BRAND.voltInk,
                  transform: "rotate(45deg)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Syne", data: syne800, weight: 800, style: "normal" },
        { name: "Syne", data: syne700, weight: 700, style: "normal" },
        { name: "JetBrains Mono", data: mono700, weight: 700, style: "normal" },
      ],
    },
  );
}
