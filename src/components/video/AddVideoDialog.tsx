"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { PersonalPlaylist, VideoPlatform } from "@/types";

export interface VideoDraft {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  platform?: VideoPlatform;
  creatorName?: string;
  youtubeVideoId?: string | null;
}

export function AddVideoDialog({
  open, onOpenChange, playlists, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlists: PersonalPlaylist[];
  onSave: (draft: VideoDraft, playlistId: string) => Promise<void>;
}) {
  const [url, setUrl] = React.useState("");
  const [draft, setDraft] = React.useState<VideoDraft>({ title: "", videoUrl: "", thumbnailUrl: "" });
  const [playlistId, setPlaylistId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setPlaylistId(playlists[0]?.id || "");
  }, [open, playlists]);

  async function fetchMetadata() {
    const nextUrl = url.trim();
    if (!nextUrl) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/video-metadata?url=${encodeURIComponent(nextUrl)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This URL is not supported.");
      setDraft({
        title: data.title || "",
        videoUrl: data.canonicalUrl || nextUrl,
        thumbnailUrl: data.thumbnailUrl || "",
        platform: data.platform,
        creatorName: data.creatorName || "",
        youtubeVideoId: data.youtubeVideoId,
      });
    } catch (cause) {
      setDraft((current) => ({ ...current, videoUrl: nextUrl }));
      setError(cause instanceof Error ? cause.message : "Metadata could not be loaded. You can still enter a title manually.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draft.videoUrl || !draft.title.trim() || !playlistId) return;
    setSaving(true);
    try {
      await onSave({ ...draft, title: draft.title.trim() }, playlistId);
      setUrl("");
      setDraft({ title: "", videoUrl: "", thumbnailUrl: "" });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Save a video</DialogTitle>
          <DialogDescription>Paste a video URL and we&apos;ll fill in the details when the platform allows it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="video-url">Video URL</Label>
            <div className="flex gap-2">
              <Input id="video-url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && fetchMetadata()} placeholder="https://www.youtube.com/watch?v=..." />
              <Button type="button" variant="secondary" onClick={fetchMetadata} disabled={loading || !url.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview"}</Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {draft.videoUrl && (
            <div className="flex gap-3 rounded-md border border-border bg-secondary/40 p-3">
              <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
                {draft.thumbnailUrl ? <Image src={draft.thumbnailUrl} alt="" width={112} height={64} className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Badge variant="secondary">{draft.platform || "other"}</Badge>
                <p className="truncate text-sm text-muted-foreground">{draft.videoUrl}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="video-title">Title</Label>
            <Input id="video-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Give this video a title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-playlist">Save to playlist</Label>
            {playlists.length ? <select id="video-playlist" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choose a playlist</option>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.title}</option>)}</select> : <p className="text-sm text-muted-foreground">Create a personal playlist first in <Link href="/my-playlists" className="text-accent underline">My Playlists</Link>.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !draft.title.trim() || !draft.videoUrl || !playlistId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save video</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
