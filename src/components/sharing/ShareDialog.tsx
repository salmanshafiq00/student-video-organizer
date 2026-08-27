"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ShareVisibility } from "@/types";

const options: Array<{ value: ShareVisibility; label: string; description: string }> = [
  { value: "private", label: "Private", description: "Only you can access it." },
  { value: "unlisted", label: "Anyone with the link", description: "Hidden from discovery, available by link." },
  { value: "public", label: "Public", description: "Anyone can view it." },
];

export function ShareDialog({
  open, onOpenChange, title, shareUrl, visibility, onVisibilityChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  shareUrl: string;
  visibility: ShareVisibility;
  onVisibilityChange: (visibility: ShareVisibility) => Promise<void>;
}) {
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function changeVisibility(next: ShareVisibility) {
    if (next === visibility) return;
    setSaving(true);
    try {
      await onVisibilityChange(next);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-accent" /> {title}</DialogTitle>
          <DialogDescription>Choose who can view this resource.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2" disabled={saving}>
          <legend className="text-sm font-medium">Visibility</legend>
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-secondary/50">
              <input type="radio" name="share-visibility" value={option.value} checked={visibility === option.value} onChange={() => changeVisibility(option.value)} className="mt-1" />
              <span className="space-y-0.5"><span className="block text-sm font-medium">{option.label}</span><span className="block text-xs text-muted-foreground">{option.description}</span></span>
            </label>
          ))}
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor="share-url" className="text-sm font-medium">Share URL</label>
          <div className="flex gap-2">
            <input id="share-url" value={shareUrl} readOnly className="h-9 min-w-0 flex-1 rounded-md border border-input bg-secondary/40 px-3 text-xs" />
            <Button type="button" size="sm" onClick={copyLink}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy Link"}</Button>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
