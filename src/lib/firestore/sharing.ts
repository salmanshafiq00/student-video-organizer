import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PersonalPlaylist, PersonalVideo, PublicShare, ShareVisibility } from "@/types";

const shareDoc = (token: string) => doc(db, "publicShares", token);
const videoDoc = (ownerId: string, playlistId: string, videoId: string) =>
  doc(db, "users", ownerId, "personalPlaylists", playlistId, "videos", videoId);
const playlistDoc = (ownerId: string, playlistId: string) =>
  doc(db, "users", ownerId, "personalPlaylists", playlistId);

function newShareToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function publicVideo(video: PersonalVideo) {
  return {
    title: video.title,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    platform: video.platform,
    creatorName: video.creatorName,
    durationSeconds: video.durationSeconds,
    playlistId: video.playlistId,
  };
}

export async function preparePersonalVideoShare(ownerId: string, playlistId: string, videoId: string) {
  const ref = videoDoc(ownerId, playlistId, videoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Video not found");
  const video = { id: snap.id, playlistId, ownerId, ...snap.data() } as PersonalVideo;
  const token = video.shareToken || newShareToken();
  const visibility = video.visibility || "private";
  if (!video.shareToken) await setDoc(ref, { shareToken: token, visibility, updatedAt: serverTimestamp() }, { merge: true });
  return { token, visibility };
}

export async function updatePersonalVideoVisibility(ownerId: string, playlistId: string, videoId: string, visibility: ShareVisibility) {
  const ref = videoDoc(ownerId, playlistId, videoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Video not found");
  const video = { id: snap.id, playlistId, ownerId, ...snap.data() } as PersonalVideo;
  const token = video.shareToken || newShareToken();
  const batch = writeBatch(db);
  batch.update(ref, { visibility, shareToken: token, updatedAt: serverTimestamp() });
  batch.set(shareDoc(token), { token, resourceType: "video", visibility, ownerId, resourceId: videoId, ...publicVideo(video), updatedAt: serverTimestamp() });
  await batch.commit();
  return token;
}

export async function preparePersonalPlaylistShare(ownerId: string, playlistId: string) {
  const ref = playlistDoc(ownerId, playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Playlist not found");
  const playlist = { id: snap.id, ownerId, ...snap.data() } as PersonalPlaylist;
  const token = playlist.shareToken || newShareToken();
  const visibility = playlist.visibility || "private";
  if (!playlist.shareToken) await setDoc(ref, { shareToken: token, visibility, updatedAt: serverTimestamp() }, { merge: true });
  return { token, visibility };
}

export async function updatePersonalPlaylistVisibility(ownerId: string, playlistId: string, visibility: ShareVisibility) {
  const ref = playlistDoc(ownerId, playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Playlist not found");
  const playlist = { id: snap.id, ownerId, ...snap.data() } as PersonalPlaylist;
  const videosSnap = await getDocs(query(
    collection(db, "users", ownerId, "personalPlaylists", playlistId, "videos"),
    orderBy("order", "asc")
  ));
  const videos = videosSnap.docs.map((item) => {
    const video = { id: item.id, playlistId, ownerId, ...item.data() } as PersonalVideo;
    return { id: video.id, order: video.order, ...publicVideo(video) };
  });
  const token = playlist.shareToken || newShareToken();
  const batch = writeBatch(db);
  batch.update(ref, { visibility, shareToken: token, updatedAt: serverTimestamp() });
  batch.set(shareDoc(token), { token, resourceType: "playlist", visibility, ownerId, resourceId: playlistId, title: playlist.title, description: playlist.description || "", videos, updatedAt: serverTimestamp() });
  await batch.commit();
  return token;
}

export async function syncPersonalPlaylistShare(ownerId: string, playlistId: string) {
  const playlistSnap = await getDoc(playlistDoc(ownerId, playlistId));
  if (!playlistSnap.exists()) return;
  const playlist = { id: playlistSnap.id, ownerId, ...playlistSnap.data() } as PersonalPlaylist;
  if (!playlist.shareToken) return;
  const videosSnap = await getDocs(query(
    collection(db, "users", ownerId, "personalPlaylists", playlistId, "videos"),
    orderBy("order", "asc")
  ));
  const videos = videosSnap.docs.map((item) => {
    const video = { id: item.id, playlistId, ownerId, ...item.data() } as PersonalVideo;
    return { id: video.id, order: video.order, ...publicVideo(video) };
  });
  await setDoc(shareDoc(playlist.shareToken), {
    token: playlist.shareToken,
    resourceType: "playlist",
    visibility: playlist.visibility || "private",
    ownerId,
    resourceId: playlistId,
    title: playlist.title,
    description: playlist.description || "",
    videos,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePersonalShare(token: string) {
  await deleteDoc(shareDoc(token));
}

export async function getPublicShare(token: string): Promise<PublicShare | null> {
  const snap = await getDoc(shareDoc(token));
  if (!snap.exists() || snap.data().visibility === "private") return null;
  return snap.data() as PublicShare;
}