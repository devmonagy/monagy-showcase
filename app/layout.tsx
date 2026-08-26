import type { Metadata } from "next";
import { Syne, Space_Grotesk, Reem_Kufi } from "next/font/google";
import { PERF_BOOT_SCRIPT } from "./lib/perf";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Bold geometric Kufic display face for Arabic now-playing titles/artists —
// a real Arabic type choice (not a browser Latin-font fallback rendering
// tofu/system-serif Arabic), picked to match Syne's extrabold geometric
// energy elsewhere on the site. Loaded globally but only ever applied
// conditionally in PersonalTelemetrySection when Arabic script is detected.
//
// Plain "Reem Kufi", not "Reem Kufi Fun": the "Fun" variant's playful
// alternates are implemented as embedded COLR/CPAL color-font layers, so
// certain marks (diacritics, some hamza forms) paint in a fixed baked-in
// color that ignores the CSS `color` property entirely — confirmed by
// rendering both to a canvas and sampling pixels; "Fun" produced 112
// off-palette red/orange pixels on a diacritic-heavy string, plain
// "Reem Kufi" produced zero. Same bold geometric Kufic character, no
// color-glyph side effect.
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-arabic-display",
  display: "swap",
});

const SITE_TITLE = "Mohamed Nagy | Software Developer";
const SITE_DESCRIPTION =
  "Mohamed Nagy — Software Developer. A high-energy, color-blocked showcase of experience and projects.";

export const metadata: Metadata = {
  metadataBase: new URL("https://monagy.com"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://monagy.com",
    siteName: "Mohamed Nagy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${reemKufi.variable}`}
      // The perf boot script below writes data-perf onto this element before
      // React hydrates, so the client tree legitimately carries an attribute
      // the server markup never had — which React reports as a hydration
      // mismatch on <html>. Suppressing is the documented answer for exactly
      // this pattern (it's how theme scripts do it) and is scoped to this
      // element's own attributes, not the tree beneath it. The alternative,
      // rendering the attribute server-side, is impossible: the whole point
      // is that only the browser knows what the device can do.
      suppressHydrationWarning
    >
      <head>
        {/* Classifies the device into a performance tier and stamps
            <html data-perf="low|high"> BEFORE first paint. Blocking and
            inline on purpose: every expensive effect on the page is gated
            on that attribute, so deferring this to hydration would paint
            one or more frames of the full-cost desktop treatment on
            exactly the hardware that can't afford it — the flash-of-wrong-
            styles problem, with a frame budget attached. It's a few
            hundred bytes of parse time and touches nothing but one
            attribute. See app/lib/perf.ts (deliberately NOT a "use client"
            module — this server component needs to read the real string,
            not a client reference proxy). */}
        <script dangerouslySetInnerHTML={{ __html: PERF_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
