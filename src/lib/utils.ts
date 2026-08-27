import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { VideoPlatform } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "--:--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatWatchTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const match = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

export function detectVideoPlatform(value: string): VideoPlatform {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be") return "youtube";
    if (hostname === "facebook.com" || hostname.endsWith(".facebook.com") || hostname === "fb.watch") return "facebook";
    if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) return "vimeo";
  } catch {
    // Invalid URLs are handled by the metadata endpoint and Firestore rules.
  }
  return "other";
}

export function extractYouTubePlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10); // yyyy-mm-dd (UTC — fine for a small study group)
}
