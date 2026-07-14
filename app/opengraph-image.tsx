import { ImageResponse } from "next/og";
import { BRAND, gridBackground, glowOrbStyle, loadGoogleFont } from "./_brand/shared";
import { SITE } from "./data/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} — Software Developer Portfolio`;

const SYNE_800_TEXT = "MohamedNagy.MN";
const SYNE_700_TEXT = SITE.tagline;
const MONO_TEXT =
  "PORTFOLIO NYC · SELECT FREELANCE SOFTWARE DEVELOPER monagy.com REACT TYPESCRIPT NODE.JS";

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
            size: 620,
            top: -220,
            left: -180,
          })}
        />
        <div
          style={glowOrbStyle({
            color: "rgba(51,232,255,0.22)",
            size: 560,
            bottom: -220,
            right: -160,
          })}
        />

        {/* Ghost watermark — echoes the site's outlined ghost typography */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -50,
            bottom: -90,
            fontFamily: "Syne",
            fontWeight: 800,
            fontSize: 380,
            lineHeight: 1,
            letterSpacing: -8,
            color: "rgba(255,255,255,0.035)",
          }}
        >
          MN
        </div>

        {/* Dashed orbit-ring accent */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 64,
            right: 300,
            width: 130,
            height: 130,
            borderRadius: "50%",
            border: "2px dashed rgba(51,232,255,0.35)",
          }}
        />

        {/* Diamond accent */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 90,
            left: 56,
            width: 24,
            height: 24,
            border: "2px solid rgba(214,255,63,0.45)",
            transform: "rotate(45deg)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "58px 84px",
          }}
        >
          {/* Top status row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
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
                  fontSize: 19,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                  color: BRAND.volt,
                }}
              >
                Portfolio
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: BRAND.textMuted,
              }}
            >
              NYC · Select Freelance
            </div>
          </div>

          {/* Name block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", width: 40, height: 2, background: BRAND.volt }} />
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: 6,
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
                flexDirection: "column",
                fontFamily: "Syne",
                fontWeight: 800,
                fontSize: 110,
                lineHeight: 0.95,
                letterSpacing: -3,
                color: BRAND.textContrast,
              }}
            >
              <div style={{ display: "flex" }}>Mohamed</div>
              <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex" }}>Nagy</div>
                <div style={{ display: "flex", color: BRAND.volt }}>.</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 20,
                maxWidth: 820,
                fontFamily: "Syne",
                fontWeight: 700,
                fontSize: 31,
                lineHeight: 1.25,
                color: BRAND.cyan,
              }}
            >
              {SITE.tagline}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.14)",
              paddingTop: 26,
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", width: 26, height: 2, background: BRAND.volt }} />
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontWeight: 700,
                  fontSize: 27,
                  letterSpacing: 1,
                  color: BRAND.textContrast,
                }}
              >
                monagy.com
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              {["REACT", "TYPESCRIPT", "NODE.JS"].map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontFamily: "JetBrains Mono",
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: BRAND.textMuted,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
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
