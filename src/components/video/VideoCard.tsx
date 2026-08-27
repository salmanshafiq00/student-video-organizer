"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check, CheckCircle2, Clock, ExternalLink, GripVertical, MoreVertical,
  Share2, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn, formatDuration } from "@/lib/utils";
import type { VideoWithState } from "@/types";

const priorityDot: Record<string, string> = {
  high: "bg-priorityHigh",
  medium: "bg-priorityMedium",
  low: "bg-priorityLow",
};

export function VideoCard({
  video, dragHandleProps, className, onToggleFavorite, onToggleWatched, onShare,
}: {
  video: VideoWithState;
  dragHandleProps?: any;
  className?: string;
  onToggleFavorite?: () => void;
  onToggleWatched?: () => void;
  onShare?: () => void;
}) {
  const pct = video.state?.watchedPercentage || 0;
  const completed = video.state?.status === "completed";
  const platformLabel = video.platform === "youtube" ? "YouTube" : video.platform === "facebook" ? "Facebook" : video.platform === "vimeo" ? "Vimeo" : "Other";
  const watchLabel = video.platform === "youtube" ? "Watch on YouTube" : `Watch on ${platformLabel}`;

  async function shareVideo() {
    if (onShare) return onShare();
    if (navigator.share) {
      await navigator.share({ title: video.title, url: video.videoUrl });
    } else {
      await navigator.clipboard.writeText(video.videoUrl);
    }
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link href={video.isPersonal ? `/my-playlists/${video.playlistId}/${video.id}` : `/video/${video.id}?playlist=${video.playlistId}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-secondary">
          {video.thumbnailUrl && <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute left-2 top-2 cursor-grab rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          {video.state?.isFavorite && (
            <span className="rounded-full bg-black/60 p-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /></span>
          )}
          {video.state?.isWatchLater && (
            <span className="rounded-full bg-black/60 p-1"><Clock className="h-3.5 w-3.5 text-white" /></span>
          )}
        </div>
        {video.state?.priority && (
          <span className={cn("absolute left-2 bottom-2 h-2.5 w-2.5 rounded-full ring-2 ring-white/80", priorityDot[video.state.priority])} />
        )}
        {video.durationSeconds ? (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        ) : null}
        {completed && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </span>
        )}
        {pct > 0 && (
          <div className="absolute inset-x-0 bottom-0">
            <Progress value={pct} className="h-1 rounded-none bg-black/30" />
          </div>
        )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={video.isPersonal ? `/my-playlists/${video.playlistId}/${video.id}` : `/video/${video.id}?playlist=${video.playlistId}`} className="min-w-0 hover:underline">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="outline" className="shrink-0">{platformLabel}</Badge>
          {video.creatorName && <span className="truncate">{video.creatorName}</span>}
          {video.durationSeconds ? <span className="shrink-0">· {formatDuration(video.durationSeconds)}</span> : null}
        </div>
        {video.playlistTitle && <p className="truncate text-xs text-muted-foreground">{video.playlistTitle}</p>}
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          {completed && <Badge variant="success">Completed</Badge>}
          {!completed && pct > 0 && <Badge variant="secondary">{pct}% watched</Badge>}
          {video.state?.priority && (
            <Badge variant={video.state.priority === "high" ? "priorityHigh" : video.state.priority === "medium" ? "priorityMedium" : "priorityLow"}>
              {video.state.priority}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 border-t border-border pt-2">
          <Button asChild size="sm" className="min-w-0 flex-1">
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> <span className="truncate">{watchLabel}</span>
            </a>
          </Button>
          <Button
            variant={video.state?.isFavorite ? "accent" : "ghost"}
            size="icon"
            onClick={onToggleFavorite}
            disabled={!onToggleFavorite}
            aria-label={video.state?.isFavorite ? "Remove favorite" : "Add favorite"}
            title={video.state?.isFavorite ? "Remove favorite" : "Favorite"}
          >
            <Star className={video.state?.isFavorite ? "fill-current" : ""} />
          </Button>
          <Button
            variant={completed ? "accent" : "ghost"}
            size="icon"
            onClick={onToggleWatched}
            disabled={!onToggleWatched}
            aria-label={completed ? "Mark unwatched" : "Mark watched"}
            title={completed ? "Mark unwatched" : "Watched"}
          >
            {completed ? <Check /> : <CheckCircle2 />}
          </Button>
          <Button variant="ghost" size="icon" onClick={shareVideo} aria-label="Share video" title="Share">
            <Share2 />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More video actions" title="More"><MoreVertical /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><a href={video.videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open original video</a></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={shareVideo}><Share2 /> Copy or share link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
