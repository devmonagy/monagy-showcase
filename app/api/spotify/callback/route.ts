// app/api/spotify/callback/route.ts
// Companion to /api/spotify/authorize — exchanges the one-time code Spotify
// hands back for a refresh token, and prints it once so it can be copied
// into SPOTIFY_REFRESH_TOKEN. Nothing is persisted here; safe to leave in
// place (the code is single-use and expires in minutes), but there's no
// reason to keep hitting it after setup.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET" },
      { status: 500 },
    );
  }

  // Must exactly match the redirect_uri used in /api/spotify/authorize —
  // see the comment there for why this isn't derived from request.url.
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_REDIRECT_URI" },
      { status: 500 },
    );
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }

  return new NextResponse(
    `<!doctype html>
<html><body style="font-family:monospace;padding:2rem;max-width:640px;margin:0 auto">
<h1>Spotify connected</h1>
<p>Copy this into <b>SPOTIFY_REFRESH_TOKEN</b> (local .env.local and your host's env vars), then redeploy:</p>
<pre style="white-space:pre-wrap;word-break:break-all;background:#eee;padding:1rem;border-radius:8px">${data.refresh_token}</pre>
<p>This token doesn't expire on its own — you only need to do this once.</p>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
