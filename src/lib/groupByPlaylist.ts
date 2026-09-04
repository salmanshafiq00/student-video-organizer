export interface PlaylistGroup<T> {
  /** null only for the synthetic "Other" bucket — videos missing a
   *  playlistId (shouldn't happen once every video has a home, but the
   *  cross-cutting views merge two tiers so this is handled defensively). */
  playlistId: string | null;
  playlistTitle: string;
  videos: T[];
}

/**
 * Buckets an already-ordered video list into per-playlist sections while
 * preserving each video's relative order within its bucket. Used by the
 * Watch Later, Priority, and Continue Watching pages so a flat cross-tier
 * feed reads as "grouped by playlist" instead of one long undifferentiated
 * list.
 *
 * Group order follows each playlist's first appearance in `videos` — pass
 * in an already-sorted list (e.g. by watchLaterOrder, or by recency) if you
 * want a particular group ordering; this function does not re-sort.
 * Videos with no playlistId are collected into a trailing "Other" group
 * that is omitted entirely when empty, rather than rendered with a header
 * and nothing under it.
 */
export function groupVideosByPlaylist<
  T extends { playlistId?: string | null; playlistTitle?: string | null }
>(videos: T[]): PlaylistGroup<T>[] {
  const order: string[] = [];
  const byPlaylist = new Map<string, PlaylistGroup<T>>();
  const other: T[] = [];

  for (const video of videos) {
    if (!video.playlistId) {
      other.push(video);
      continue;
    }
    let group = byPlaylist.get(video.playlistId);
    if (!group) {
      group = {
        playlistId: video.playlistId,
        playlistTitle: video.playlistTitle || "Untitled Playlist",
        videos: [],
      };
      byPlaylist.set(video.playlistId, group);
      order.push(video.playlistId);
    }
    group.videos.push(video);
  }

  const groups = order.map((id) => byPlaylist.get(id)!);
  if (other.length > 0) {
    groups.push({ playlistId: null, playlistTitle: "Other", videos: other });
  }
  return groups;
}
