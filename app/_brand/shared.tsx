// Shared building blocks for generated brand assets (favicon, apple-icon,
// opengraph-image, and the one-off Facebook profile/cover exports). Not a
// route — lives under app/_brand so Next's App Router ignores it entirely.

// Same palette as globals.css :root — kept in sync manually since these
// images render server-side via Satori, which can't read CSS custom
// properties.
export const BRAND = {
  bg: "#050507",
  textContrast: "#f7f7f5",
  textMuted: "#9a9aa5",
  volt: "#d6ff3f",
  voltInk: "#0a0e02",
  cyan: "#33e8ff",
  violet: "#8b5cf6",
};

// opengraph-image/icon/apple-icon are all statically prerendered, so this
// runs during `next build` itself — a live network call to Google's
// servers gating whether the whole deploy succeeds. Confirmed on
// 2026-07-16: a single transient ETIMEDOUT reaching Google Fonts mid-build
// failed a real deployment outright, while an identical rebuild moments
// later succeeded. Three attempts with doubling backoff is enough to ride
// out a blip like that without meaningfully slowing a healthy build.
async function fetchWithRetry(
  url: string,
  attempts = 3,
  delayMs = 400,
): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** i));
    }
  }
  // Unreachable — the loop above always returns or throws on the final
  // attempt — but keeps TypeScript happy about the return type.
  throw new Error("fetchWithRetry: exhausted attempts");
}

// Google Fonts CSS2 API returns a stylesheet whose @font-face src we pull
// the actual font file URL from; `text` subsets the request to only the
// glyphs actually used, keeping the fetch small. Standard pattern for
// next/og — Satori needs real font bytes, it has no access to system fonts.
export async function loadGoogleFont(
  font: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    font,
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetchWithRetry(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (match) {
    const res = await fetchWithRetry(match[1]);
    if (res.ok) return res.arrayBuffer();
  }
  throw new Error(`Failed to load font: ${font}`);
}

// Faint graph-paper grid — same construction as Backdrop3D's perspective
// grid floor (linear-gradient hairlines, not a repeating dot image, which
// Satori doesn't render reliably).
export const gridBackground: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

export function glowOrbStyle({
  color,
  size,
  top,
  left,
  right,
  bottom,
}: {
  color: string;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}): React.CSSProperties {
  // Satori (next/og's renderer) throws deep inside its style parser when a
  // style object has a key present with value `undefined` (e.g. `right:
  // undefined`) — it iterates every key and assumes each value is a string.
  // Only spread in the offsets that were actually passed.
  return {
    position: "absolute",
    width: size,
    height: size,
    ...(top !== undefined ? { top } : {}),
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
    ...(bottom !== undefined ? { bottom } : {}),
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
  };
}
