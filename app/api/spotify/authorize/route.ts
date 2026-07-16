// app/api/spotify/authorize/route.ts
// One-time setup route: visit this once (locally or in prod, matching
// whichever redirect URI is registered in the Spotify dashboard) to grant
// this app access to your own account's playback state. It redirects to
// Spotify's consent screen, which redirects back to /api/spotify/callback
// with a code that gets exchanged for a refresh token.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID" },
      { status: 500 },
    );
  }

  // Deliberately NOT derived from request.url: Next's dev server reports
  // request.url with hostname "localhost" regardless of the actual host
  // used to reach it (confirmed by curling 127.0.0.1 directly and still
  // getting "localhost" back), and Spotify's redirect URI policy rejects
  // "localhost" outright (only the literal 127.0.0.1/::1 loopback address
  // is accepted, "https" required otherwise) — so a request-derived value
  // can never match what's registered in the Spotify dashboard locally.
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_REDIRECT_URI" },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "user-read-currently-playing user-read-playback-state",
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
}
