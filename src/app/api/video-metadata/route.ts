import { NextRequest, NextResponse } from "next/server";
import { detectVideoPlatform, extractYouTubeId } from "@/lib/utils";
import type { VideoPlatform } from "@/types";

function isAllowedVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const OEMBED_ENDPOINTS: Partial<Record<VideoPlatform, string>> = {
  youtube: "https://www.youtube.com/oembed",
  vimeo: "https://vimeo.com/api/oembed.json",
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim() || "";
  if (!rawUrl || !isAllowedVideoUrl(rawUrl)) {
    return NextResponse.json({ error: "Enter a supported HTTPS video URL." }, { status: 400 });
  }

  const platform = detectVideoPlatform(rawUrl);
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) {
    return NextResponse.json({
      platform,
      canonicalUrl: rawUrl,
      youtubeVideoId: extractYouTubeId(rawUrl),
      title: "",
      creatorName: "",
      thumbnailUrl: "",
    });
  }

  try {
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(rawUrl)}&format=json`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        platform,
        canonicalUrl: rawUrl,
        youtubeVideoId: extractYouTubeId(rawUrl),
        title: data.title || "",
        creatorName: data.author_name || "",
        thumbnailUrl: data.thumbnail_url || "",
      });
    }
  } catch {
    // The bookmark can still be saved with a manual title when providers do not respond.
  }

  return NextResponse.json({
    platform,
    canonicalUrl: rawUrl,
    youtubeVideoId: extractYouTubeId(rawUrl),
    title: "",
    creatorName: "",
    thumbnailUrl: "",
  });
}
