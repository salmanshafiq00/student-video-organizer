import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groupVideosByPlaylist } from "./groupByPlaylist";

interface FakeVideo {
  id: string;
  playlistId?: string | null;
  playlistTitle?: string | null;
}

describe("groupVideosByPlaylist", () => {
  it("returns an empty array for an empty input list", () => {
    assert.deepEqual(groupVideosByPlaylist<FakeVideo>([]), []);
  });

  it("groups videos by playlistId, preserving within-group order", () => {
    const videos: FakeVideo[] = [
      { id: "a1", playlistId: "p1", playlistTitle: "Playlist One" },
      { id: "b1", playlistId: "p2", playlistTitle: "Playlist Two" },
      { id: "a2", playlistId: "p1", playlistTitle: "Playlist One" },
    ];
    const groups = groupVideosByPlaylist(videos);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].playlistId, "p1");
    assert.deepEqual(groups[0].videos.map((v) => v.id), ["a1", "a2"]);
    assert.equal(groups[1].playlistId, "p2");
    assert.deepEqual(groups[1].videos.map((v) => v.id), ["b1"]);
  });

  it("orders groups by each playlist's first appearance in the input", () => {
    const videos: FakeVideo[] = [
      { id: "x", playlistId: "later", playlistTitle: "Later" },
      { id: "y", playlistId: "first", playlistTitle: "First" },
      { id: "z", playlistId: "later", playlistTitle: "Later" },
    ];
    const groups = groupVideosByPlaylist(videos);
    assert.deepEqual(groups.map((g) => g.playlistId), ["later", "first"]);
  });

  it("collects videos with no playlistId into a trailing Other group", () => {
    const videos: FakeVideo[] = [
      { id: "a", playlistId: "p1", playlistTitle: "P1" },
      { id: "b", playlistId: null },
      { id: "c", playlistId: undefined },
    ];
    const groups = groupVideosByPlaylist(videos);
    assert.equal(groups.length, 2);
    assert.equal(groups[1].playlistId, null);
    assert.equal(groups[1].playlistTitle, "Other");
    assert.deepEqual(groups[1].videos.map((v) => v.id), ["b", "c"]);
  });

  it("omits the Other group entirely when nothing is missing a playlistId", () => {
    const videos: FakeVideo[] = [{ id: "a", playlistId: "p1", playlistTitle: "P1" }];
    const groups = groupVideosByPlaylist(videos);
    assert.equal(groups.some((g) => g.playlistId === null), false);
  });

  it("falls back to a placeholder title when playlistTitle is missing", () => {
    const videos: FakeVideo[] = [{ id: "a", playlistId: "p1" }];
    const groups = groupVideosByPlaylist(videos);
    assert.equal(groups[0].playlistTitle, "Untitled Playlist");
  });
});
