"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useVideoLibrary } from "@/hooks/useVideoLibrary";
import { FilterBar } from "@/components/filters/FilterBar";
import { VideoGrid } from "@/components/video/VideoGrid";
import { AddVideoDialog, type VideoDraft } from "@/components/video/AddVideoDialog";
import { VideoCard } from "@/components/video/VideoCard";
import { listCategories, listTags } from "@/lib/firestore/categoriesTags";
import { addPersonalVideo, listPersonalPlaylists } from "@/lib/firestore/personalPlaylists";
import { setWatchedStatus, toggleFavorite } from "@/lib/firestore/userVideoState";
import { setPersonalVideoWatched, togglePersonalVideoFavorite } from "@/lib/firestore/personalPlaylists";
import { applyFilters, applySort } from "@/lib/filterSort";
import { extractYouTubeId } from "@/lib/utils";
import type { Category, HomeFilters, PersonalPlaylist, SortOption, Tag } from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user, profile } = useAuth();
  const { loading, error, playlists, videos, refresh } = useVideoLibrary(user?.uid);
  const [personalPlaylists, setPersonalPlaylists] = React.useState<PersonalPlaylist[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [filters, setFilters] = React.useState<HomeFilters>({});
  const [sort, setSort] = React.useState<SortOption>("recently-added");

  React.useEffect(() => {
    listCategories().then(setCategories);
    listTags().then(setTags);
  }, []);

  React.useEffect(() => {
    if (user?.uid) listPersonalPlaylists(user.uid).then(setPersonalPlaylists);
  }, [user?.uid]);

  async function handleSaveVideo(draft: VideoDraft, playlistId: string) {
    if (!user?.uid) return;
    await addPersonalVideo(user.uid, playlistId, {
      title: draft.title,
      videoUrl: draft.videoUrl,
      platform: draft.platform,
      creatorName: draft.creatorName,
      youtubeVideoId: draft.youtubeVideoId || extractYouTubeId(draft.videoUrl),
      thumbnailUrl: draft.thumbnailUrl,
    });
    toast.success("Video saved to your playlist");
    setPersonalPlaylists((current) => current.map((playlist) => playlist.id === playlistId
      ? { ...playlist, videoCount: playlist.videoCount + 1 }
      : playlist));
  }

  async function handleToggleFavorite(video: (typeof videos)[number]) {
    if (!user) return;
    if (video.isPersonal) {
      await togglePersonalVideoFavorite(user.uid, video.playlistId, video.id, !video.state?.isFavorite);
    } else {
      await toggleFavorite(user.uid, video.id, video.playlistId, !video.state?.isFavorite);
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

  const continueLearning = React.useMemo(
    () => videos.filter((v) => v.state?.status === "in_progress").sort((a, b) => (b.state?.watchedPercentage || 0) - (a.state?.watchedPercentage || 0)).slice(0, 4),
    [videos]
  );

  const filtered = React.useMemo(() => applySort(applyFilters(videos, filters), sort), [videos, filters, sort]);

  return (
    <AppShell onSearch={(q) => setFilters((f) => ({ ...f, query: q }))}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting()}, {profile?.displayName?.split(" ")[0] || "there"}
            </p>
            <h1 className="font-display text-2xl font-semibold">What are you learning today?</h1>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Save a video</Button>
        </div>

        {!loading && continueLearning.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Continue Learning</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {continueLearning.map((v) => <VideoCard key={v.id} video={v} onToggleFavorite={() => handleToggleFavorite(v)} onToggleWatched={() => handleToggleWatched(v)} />)}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Library</h2>
            <span className="text-sm text-muted-foreground">{filtered.length} videos</span>
          </div>
          <FilterBar
            playlists={playlists}
            categories={categories}
            tags={tags}
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
          />
          {error ? (
            <div className="rounded-lg border border-dashed border-destructive/50 py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>Try again</Button>
            </div>
          ) : (
            <VideoGrid videos={filtered} loading={loading} onToggleFavorite={handleToggleFavorite} onToggleWatched={handleToggleWatched} emptyTitle="No videos match your filters" emptyHint="Try clearing a filter or check back once an admin adds content." />
          )}
        </section>
      </div>
      <AddVideoDialog open={addOpen} onOpenChange={setAddOpen} playlists={personalPlaylists} onSave={handleSaveVideo} />
    </AppShell>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
