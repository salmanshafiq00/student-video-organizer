"use client";

import * as React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ExternalLink, Lock, Share2 } from "lucide-react";
import { getPublicShare } from "@/lib/firestore/sharing";
import type { PublicShare } from "@/types";
import { formatDuration } from "@/lib/utils";

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = React.useState<PublicShare | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getPublicShare(token).then(setShare).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <main className="mx-auto max-w-3xl p-8 text-sm text-muted-foreground">Loading shared resource...</main>;
  if (!share) {
    return <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-8 text-center"><div><Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h1 className="font-display text-xl font-semibold">This share link is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">The resource is private or the link is invalid.</p></div></main>;
  }

  return <main className="min-h-screen bg-background px-4 py-10"><div className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Share2 className="h-4 w-4 text-accent" /> Shared from Study Lamp</div>
    <header><h1 className="font-display text-3xl font-semibold">{share.title}</h1>{share.description && <p className="mt-2 text-muted-foreground">{share.description}</p>}</header>
    {share.resourceType === "video" ? <SharedVideo share={share} /> : <section className="space-y-3">{(share.videos || []).map((video) => <article key={video.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"><div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-secondary">{video.thumbnailUrl && <Image src={video.thumbnailUrl} alt="" fill className="object-cover" sizes="112px" />}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-medium">{video.title}</h2><p className="text-xs text-muted-foreground">{video.platform || "other"}{video.creatorName ? ` · ${video.creatorName}` : ""}{video.durationSeconds ? ` · ${formatDuration(video.durationSeconds)}` : ""}</p></div><a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-input p-2 text-sm" aria-label="Open original video" title="Open original video"><ExternalLink className="h-4 w-4" /></a></article>)}</section>}
  </div></main>;
}

function SharedVideo({ share }: { share: PublicShare }) {
  return <article className="space-y-4 rounded-lg border border-border bg-card p-4"><div className="relative aspect-video w-full overflow-hidden rounded-md bg-secondary">{share.thumbnailUrl && <Image src={share.thumbnailUrl} alt={share.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />}</div><div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{share.platform || "other"}</span>{share.creatorName && <span>· {share.creatorName}</span>}{share.durationSeconds && <span>· {formatDuration(share.durationSeconds)}</span>}</div><a href={share.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><ExternalLink className="h-4 w-4" /> Watch original video</a></article>;
}
