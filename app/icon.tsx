import { ImageResponse } from "next/og";
import { BRAND, loadGoogleFont } from "./_brand/shared";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser-tab favicon. Kept to a single bold two-letter monogram — anything
// busier (the full "MN." wordmark, an accent dot) turns to mud once the
// browser downsamples this to 16px.
export default async function Icon() {
  const syne800 = await loadGoogleFont("Syne", 800, "MN");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.bg,
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Syne",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: -0.5,
            color: BRAND.volt,
            lineHeight: 1,
          }}
        >
          MN
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Syne", data: syne800, weight: 800, style: "normal" }],
    },
  );
}
