"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useVideoLibrary } from "@/hooks/useVideoLibrary";
import { SortableList } from "@/components/dnd/SortableList";
import { VideoListRow } from "@/components/video/VideoListRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  toggleWatchLater, setWatchedStatus, setPriority, reorderPersonalList,
} from "@/lib/firestore/userVideoState";
import { reorderPersonalVideoState, setPersonalVideoWatched, togglePersonalVideoWatchLater } from "@/lib/firestore/personalPlaylists";
import type { VideoWithState } from "@/types";
import { toast } from "sonner";

export default function WatchLaterPage() {
  return (
    <RequireAuth>
      <WatchLaterContent />
    </RequireAuth>
  );
}

function WatchLaterContent() {
  const { user } = useAuth();
  const { loading, error, videos, refresh } = useVideoLibrary(user?.uid);
  const [order, setOrder] = React.useState<VideoWithState[]>([]);

  React.useEffect(() => {
    const list = videos
      .filter((v) => v.state?.isWatchLater)
      .sort((a, b) => (a.state?.watchLaterOrder || 0) - (b.state?.watchLaterOrder || 0));
    setOrder(list);
  }, [videos]);

  if (!user) return null;

  async function handleReorder(newOrder: VideoWithState[]) {
    setOrder(newOrder);
    const sharedIds = newOrder.filter((v) => !v.isPersonal).map((v) => v.id);
    if (sharedIds.length > 0) await reorderPersonalList(user!.uid, sharedIds, "watchLaterOrder");
    const personalByPlaylist = new Map<string, string[]>();
    newOrder.filter((v) => v.isPersonal).forEach((v) => {
      const ids = personalByPlaylist.get(v.playlistId) || [];
      ids.push(v.id);
      personalByPlaylist.set(v.playlistId, ids);
    });
    await Promise.all([...personalByPlaylist].map(([playlistId, ids]) => reorderPersonalVideoState(user!.uid, playlistId, ids, "watchLaterOrder")));
  }

  async function handleRemove(v: VideoWithState) {
    try {
      if (v.isPersonal) {
        await togglePersonalVideoWatchLater(user!.uid, v.playlistId, v.id, false);
      } else {
        await toggleWatchLater(user!.uid, v.id, v.playlistId, false);
      }
      toast.success("Removed from Watch Later");
      await refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update Watch Later.");
    }
  }

  async function handleMarkWatched(v: VideoWithState) {
    const next = v.state?.status !== "completed";
    if (v.isPersonal) {
      await setPersonalVideoWatched(user!.uid, v.playlistId, v.id, next);
    } else {
      await setWatchedStatus(user!.uid, v.id, v.playlistId, next);
    }
    toast.success(next ? "Marked watched" : "Marked unwatched");
    await refresh();
  }

  async function handlePriority(v: VideoWithState, p: "high" | "medium" | "low" | null) {
    await setPriority(user!.uid, v.id, v.playlistId, p);
    refresh();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Watch Later</h1>
          <p className="text-sm text-muted-foreground">Videos you&apos;ve saved to come back to. Drag to reorder.</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[68px] w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-destructive/50 py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>Try again</Button>
          </div>
        ) : order.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nothing saved yet — tap &quot;Watch Later&quot; on any video to add it here.
          </p>
        ) : (
          <SortableList
            items={order}
            getId={(v) => v.id}
            onReorder={handleReorder}
            className="space-y-2"
            renderItem={(v, dragHandleProps) => (
              <VideoListRow
                video={v}
                dragHandleProps={dragHandleProps}
                onMarkWatched={() => handleMarkWatched(v)}
                onRemove={() => handleRemove(v)}
                onSetPriority={(p) => handlePriority(v, p)}
              />
            )}
          />
        )}
      </div>
    </AppShell>
  );
}
