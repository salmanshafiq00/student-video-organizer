"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useVideoLibrary } from "@/hooks/useVideoLibrary";
import { VideoGrid } from "@/components/video/VideoGrid";
import { setWatchedStatus, toggleFavorite } from "@/lib/firestore/userVideoState";
import { setPersonalVideoWatched, togglePersonalVideoFavorite } from "@/lib/firestore/personalPlaylists";

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesContent />
    </RequireAuth>
  );
}

function FavoritesContent() {
  const { user } = useAuth();
  const { loading, videos, refresh } = useVideoLibrary(user?.uid);
  const favorites = videos.filter((v) => v.state?.isFavorite);

  async function handleToggleFavorite(video: (typeof videos)[number]) {
    if (!user) return;
    if (video.isPersonal) {
      await togglePersonalVideoFavorite(user.uid, video.playlistId, video.id, false);
    } else {
      await toggleFavorite(user.uid, video.id, video.playlistId, false);
    }
    refresh();
  }

  async function handleToggleWatched(video: (typeof videos)[number]) {
    if (!user) return;
    if (video.isPersonal) {
      await setPersonalVideoWatched(user.uid, video.playlistId, video.id, video.state?.status !== "completed");
    } else {
      await setWatchedStatus(user.uid, video.id, video.playlistId, video.state?.status !== "completed");
    }
    refresh();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Favorites</h1>
          <p className="text-sm text-muted-foreground">Videos you&apos;ve marked as favorites — independent of priority or watch later.</p>
        </div>
        <VideoGrid
          videos={favorites}
          loading={loading}
          onToggleFavorite={handleToggleFavorite}
          onToggleWatched={handleToggleWatched}
          emptyTitle="No favorites yet"
          emptyHint='Tap the star on any video to add it here.'
        />
      </div>
    </AppShell>
  );
}
