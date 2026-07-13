// app/lib/spotify.ts
// Server-only. Uses a long-lived refresh token (minted once via
// /api/spotify/authorize + /api/spotify/callback) to pull a short-lived
// access token on every call — Spotify access tokens expire in ~1hr, so
// there's no point caching them across requests for a low-traffic widget.

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN",
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export interface NowPlaying {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumArt?: string;
  url?: string;
}

const OFFLINE: NowPlaying = { isPlaying: false };

export async function getNowPlaying(): Promise<NowPlaying> {
  const accessToken = await getAccessToken();

  const res = await fetch(NOW_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  // 204 = nothing playing right now (also covers private sessions)
  if (res.status === 204 || !res.ok) {
    return OFFLINE;
  }

  const data = await res.json();

  if (!data?.item || !data.is_playing) {
    return OFFLINE;
  }

  const isEpisode = data.currently_playing_type === "episode";

  return {
    isPlaying: true,
    title: data.item.name,
    artist: isEpisode
      ? data.item.show?.name
      : data.item.artists?.map((a: { name: string }) => a.name).join(", "),
    albumArt: isEpisode
      ? data.item.images?.[0]?.url
      : data.item.album?.images?.[0]?.url,
    url: data.item.external_urls?.spotify,
  };
}
