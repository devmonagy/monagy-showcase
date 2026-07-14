import { ImageResponse } from "next/og";
import { BRAND, gridBackground, glowOrbStyle, loadGoogleFont } from "./_brand/shared";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon. Full-bleed black (iOS applies its own rounded-square
// mask) with the real navbar wordmark treatment: "MN" in near-white, the
// "." in volt — same as Navbar.tsx's actual logo, just bigger.
export default async function AppleIcon() {
  const syne800 = await loadGoogleFont("Syne", 800, "MN.");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: BRAND.bg,
          overflow: "hidden",
        }}
      >
        <div style={gridBackground} />
        <div style={glowOrbStyle({ color: "rgba(214,255,63,0.35)", size: 220, top: -70, left: -60 })} />
        <div style={glowOrbStyle({ color: "rgba(51,232,255,0.28)", size: 200, bottom: -70, right: -60 })} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "relative",
            fontFamily: "Syne",
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          <div style={{ display: "flex", color: BRAND.textContrast }}>MN</div>
          <div style={{ display: "flex", color: BRAND.volt }}>.</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Syne", data: syne800, weight: 800, style: "normal" }],
    },
  );
}
