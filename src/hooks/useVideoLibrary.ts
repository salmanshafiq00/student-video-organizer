"use client";
import * as React from "react";
import { listPlaylists, listVideos } from "@/lib/firestore/playlists";
import { listPersonalPlaylists, listPersonalVideos } from "@/lib/firestore/personalPlaylists";
import { getAllUserVideoStates } from "@/lib/firestore/userVideoState";
import type { Playlist, Video, VideoWithState } from "@/types";

interface LibraryData {
  loading: boolean;
  error: string | null;
  playlists: Playlist[];
  videos: VideoWithState[];
  refresh: () => Promise<void>;
}

/**
 * Loads the full shared library once (playlists + their videos) plus the
 * current user's personal state map in a single extra read, then combines
 * them client-side. This intentionally avoids per-video real-time listeners
 * (see README > Firestore free-tier optimization) — data is fetched on
 * mount / explicit refresh rather than subscribed to continuously.
 */
export function useVideoLibrary(uid: string | undefined): LibraryData {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [videos, setVideos] = React.useState<VideoWithState[]>([]);

  const load = React.useCallback(async () => {
    if (!uid) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [pls, states, personalPls] = await Promise.all([
        listPlaylists(false), getAllUserVideoStates(uid), listPersonalPlaylists(uid),
      ]);
      const videosByPlaylist = await Promise.all(pls.map(async (p) => {
        const vids = await listVideos(p.id);
        return vids.map((v) => ({ ...v, state: states[v.id] || null, playlistTitle: p.title }));
      }));
      const personalVideosByPlaylist = await Promise.all(personalPls.map(async (p) => {
        const personalVideos = await listPersonalVideos(uid, p.id);
        return personalVideos.map((video) => ({
          id: video.id,
          playlistId: video.playlistId,
          title: video.title,
          videoUrl: video.videoUrl,
          platform: video.platform,
          youtubeVideoId: video.youtubeVideoId,
          thumbnailUrl: video.thumbnailUrl,
          durationSeconds: video.durationSeconds,
          creatorName: video.creatorName,
          order: video.order,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          state: {
            videoId: video.id,
            playlistId: video.playlistId,
            status: video.status,
            watchedPercentage: video.watchedPercentage,
            currentPositionSeconds: video.currentPositionSeconds,
            isFavorite: video.isFavorite,
            isWatchLater: video.isWatchLater,
            priority: video.priority,
            watchLaterOrder: video.watchLaterOrder,
            priorityOrder: video.priorityOrder,
            lastWatchedAt: video.lastWatchedAt,
            completedAt: video.completedAt,
            updatedAt: video.updatedAt,
          },
          playlistTitle: p.title,
          isPersonal: true,
          ownerId: uid,
        } satisfies VideoWithState));
      }));
      setPlaylists(pls);
      setVideos([...videosByPlaylist.flat(), ...personalVideosByPlaylist.flat()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The learning library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { loading, error, playlists, videos, refresh: load };
}
