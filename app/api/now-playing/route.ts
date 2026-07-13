// app/api/now-playing/route.ts
import { NextResponse } from "next/server";
import { getNowPlaying } from "@/app/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nowPlaying = await getNowPlaying();
    return NextResponse.json(nowPlaying, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Missing/invalid credentials, Spotify hiccup, etc. — fail closed to
    // "offline" rather than surfacing an error state in the widget.
    return NextResponse.json(
      { isPlaying: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
