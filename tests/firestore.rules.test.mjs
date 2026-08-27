import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-student-video-organizer",
    firestore: { rules: "firestore.rules" },
  });
});

after(async () => {
  await testEnv.cleanup();
});

function profile() {
  const now = Timestamp.now();
  return {
    email: "student@example.com",
    displayName: "Student",
    role: "student",
    status: "active",
    createdAt: now,
    lastActiveAt: now,
  };
}

test("students can create their own profile but cannot self-promote", async () => {
  const context = testEnv.authenticatedContext("student-1");
  const ref = doc(context.firestore(), "users/student-1");

  await assertSucceeds(setDoc(ref, profile()));
  await assertFails(setDoc(ref, { ...profile(), role: "admin" }));
});

test("shared video writes reject unknown fields", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/admin-1"), {
      ...profile(), role: "admin", email: "admin@example.com",
    });
  });
  const adminContext = testEnv.authenticatedContext("admin-1");
  const ref = doc(adminContext.firestore(), "playlists/playlist-1/videos/video-1");
  const now = Timestamp.now();
  const video = {
    title: "Lesson",
    videoUrl: "https://www.youtube.com/watch?v=video-1",
    thumbnailUrl: "",
    order: 0,
    createdAt: now,
    updatedAt: now,
  };

  await assertFails(setDoc(ref, { ...video, injectedField: true }));
});
