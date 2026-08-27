# Video Bookmark Manager

## 1. Project Overview

This project is a **video-only bookmark manager**.

It allows users to save video URLs from external platforms such as:

* YouTube
* YouTube Shorts
* Facebook
* Vimeo
* Other supported video platforms

The application does **not host, upload, or download videos**.

The application stores:

* External video URL
* Permitted video metadata
* User notes
* Tags
* Favorite state
* Watched state
* Playlist relationships

The user can later open the original video using:

* **Watch on YouTube**
* **Watch on Facebook**
* **Watch on Vimeo**
* **Watch Original Video**

depending on the detected platform.

---

# 2. IMPORTANT: Development Strategy

This project has a **long-term product roadmap**, but the current implementation is an **MVP**.

Do NOT implement the entire product roadmap at once.

Always distinguish between:

### Current MVP

Features explicitly listed in the current implementation phase.

### Future Roadmap

Features described as future, optional, or later-phase functionality.

**Never implement future features unless the user explicitly asks for them.**

The goal is to build the MVP correctly, with an architecture that allows future features to be added without unnecessary rewrites.

---

# 3. Existing Technology

The project already has:

* Next.js
* React
* Existing UI template
* Existing design system/components
* Firebase Authentication
* Firebase Firestore

Before making changes:

1. Inspect the existing project structure.
2. Understand the existing authentication implementation.
3. Understand the existing Firebase configuration.
4. Understand the existing Firestore usage.
5. Reuse existing components and utilities.
6. Follow existing coding conventions.
7. Do not replace working infrastructure unnecessarily.

Do not migrate to another framework, database, authentication provider, or UI framework.

---

# 4. Core Product Model

There is intentionally **NO CHANNEL SYSTEM in the MVP**.

Do not create:

```text
User
  ↓
Channel
  ↓
Playlist
  ↓
Video
```

Instead use:

```text
User
  ├── Videos
  └── Playlists
          └── Videos
```

A user can save a video without adding it to a playlist.

A video can belong to multiple playlists.

Example:

```text
Video:
ASP.NET Core Authentication

Playlists:
- ASP.NET Core
- Backend
- Authentication
- Watch Later
```

Avoid duplicating the same video unnecessarily.

---

# 5. MVP Scope

The current MVP consists of the following features.

## Phase 1 — Core

### Authentication

Use the existing Firebase Authentication.

Required:

* Register
* Login
* Logout
* Password reset
* Email verification if already supported by the existing implementation

---

### Video Bookmark CRUD

Users can:

* Add video
* View video
* Edit video
* Delete video

A video is a bookmark to an external URL.

---

### Platform Detection

Automatically detect supported platforms.

Initial platforms:

* YouTube
* YouTube Shorts
* Facebook
* Vimeo
* Generic/Other

The platform detection code must be extensible.

Prefer a provider-based architecture.

Example:

```text
VideoPlatformProvider
    ├── YouTubeProvider
    ├── FacebookProvider
    ├── VimeoProvider
    └── GenericProvider
```

---

### Automatic Metadata

When the user enters a supported video URL, attempt to retrieve:

* Title
* Thumbnail
* Description
* Creator/channel name
* Duration
* Published date
* Platform
* Video ID

Use official APIs or supported metadata/oEmbed mechanisms whenever possible.

Do not expose API credentials to the client.

Use Next.js server-side functionality for external API requests.

If metadata cannot be retrieved, the user must still be able to save the URL manually.

---

### Watch on Original Platform

Every video must have a clear platform-specific action.

Examples:

```text
▶ Watch on YouTube
▶ Watch on Facebook
▶ Watch on Vimeo
▶ Watch Original Video
```

The button should open the original/canonical URL.

Prefer opening it in a new tab.

Do not imply that the application hosts the video.

---

### Playlist CRUD

Users can:

* Create playlist
* Edit playlist
* Delete playlist
* View playlist
* Add videos to playlist
* Remove videos from playlist
* Reorder videos

A video may belong to multiple playlists.

Use a playlist-video relationship instead of duplicating video records.

---

# 6. Sharing — MVP

Sharing is part of the MVP.

Users can share:

### Individual Video

### Playlist

Each resource supports:

```text
Private
Anyone with the link
Public
```

---

## Private

Only the owner can access it.

---

## Anyone With Link

Anyone who has the unique share URL can view it.

It should not appear in public discovery/search.

Use an unguessable share token.

---

## Public

Anyone can view it.

Public resources may appear in future public discovery/search features.

Do not implement a complex social network.

---

# 7. Sharing UI

Every video should have:

```text
[Share]
```

Every playlist should have:

```text
[Share]
```

Share dialog:

```text
Share Video

Visibility

○ Private
○ Anyone with the link
○ Public

Share URL

[ https://example.com/share/... ]

[Copy Link]
```

The same pattern should be used for playlists.

The owner can change visibility later.

---

# 8. Public Shared Pages

Public/unlisted resources should have clean read-only pages.

Example:

```text
/video/{id}
/playlist/{id}
```

or another clean URL structure appropriate for the existing application.

Shared pages should show only information intended to be public.

Never expose:

* Private notes
* Private data
* Internal secrets
* Private playlists
* Private resources

Public visitors should not be able to modify content.

---

# 9. Video Card

Create/reuse a reusable VideoCard component.

It should show:

* Thumbnail
* Title
* Platform
* Creator
* Duration if available
* Favorite state
* Watched state

Primary action:

```text
▶ Watch on YouTube
```

Secondary actions:

```text
♡ Favorite
✓ Watched
Share
⋮ More
```

The exact UI should follow the existing template/design system.

---

# 10. Playlist UI

Playlist page should display:

```text
Playlist Title

Description

42 videos

[Start Watching]
[Share]

----------------------------

Video 1
▶ Watch on YouTube

Video 2
▶ Watch on Facebook

Video 3
▶ Watch on Vimeo
```

Allow drag-and-drop ordering if the existing UI framework supports it cleanly.

---

# 11. Favorites

Users can mark videos as favorite.

Provide:

```text
♡ Favorite
♥ Favorited
```

Create a Favorites view.

Favorites are private by default.

---

# 12. Watched State

Users can mark videos:

* Watched
* Unwatched

Provide quick actions.

Example:

```text
✓ Mark Watched
↩ Mark Unwatched
```

Do not implement complicated playback tracking in the MVP.

---

# 13. Tags

Users can add tags to videos.

Examples:

```text
.NET
C#
ASP.NET
Angular
Docker
Database
DevOps
Tutorial
```

Support:

* Add tag
* Remove tag
* Filter by tag

Do not build advanced AI categorization yet.

---

# 14. Notes

Users can add personal notes to videos.

Notes are private by default.

Example:

```text
Important section about JWT refresh tokens.

Review around 24:30.
```

Do not expose private notes on public/shared pages.

---

# 15. Duplicate Detection

Detect duplicate videos.

For supported platforms, the primary identity should be:

```text
platform + videoId
```

Also normalize URLs.

Different URLs that point to the same video should normally be detected as duplicates.

Example:

```text
This video is already saved.

Existing playlists:

• ASP.NET Core
• Backend
• Watch Later

[Add to Playlist]
```

Do not silently create duplicate bookmarks.

---

# 16. Bulk JSON Import

This is an MVP feature.

Allow users to paste JSON:

```json
[
  {
    "url": "https://www.youtube.com/watch?v=123",
    "title": "C# Tutorial"
  },
  {
    "url": "https://www.youtube.com/watch?v=456"
  },
  {
    "url": "https://vimeo.com/123456"
  }
]
```

Process:

```text
Paste JSON
    ↓
Validate JSON
    ↓
Validate URLs
    ↓
Detect platform
    ↓
Detect duplicates
    ↓
Fetch metadata
    ↓
Preview
    ↓
Select videos
    ↓
Choose playlist
    ↓
Import
```

Show:

* Successful items
* Duplicate items
* Invalid items
* Unsupported items
* Metadata failures

One invalid item must not fail the entire import.

---

# 17. External Playlist Import

This is an MVP feature.

Allow users to paste a supported external playlist URL.

Initially prioritize YouTube.

Workflow:

```text
Paste Playlist URL
        ↓
Detect Platform
        ↓
Fetch Playlist Metadata
        ↓
Show Preview
        ↓
Select Videos
        ↓
Choose Local Playlist
        ↓
Import
```

Show:

* Playlist title
* Description
* Thumbnail
* Video count
* Video list
* Video thumbnails
* Titles

Allow selecting/deselecting videos.

If the platform cannot provide playlist information through supported APIs, show a useful error instead of attempting unauthorized scraping.

---

# 18. Search

Basic search is part of the MVP.

Search:

* Video title
* Creator
* Playlist title
* Tags

Provide basic filters:

* Platform
* Playlist
* Watched
* Favorites

Do not build a complex search engine unless Firestore limitations require it.

Keep the search implementation replaceable for future full-text search.

---

# 19. Dashboard

Create a simple dashboard.

Include:

```text
My Video Library

[+ Add Video]
[Create Playlist]
[Import Playlist]
[Bulk Import]

Recently Added

Favorites

My Playlists
```

Statistics may include:

```text
Videos
Playlists
Watched
Favorites
```

Keep the dashboard simple.

---

# 20. Firestore Data Model

Use a data model appropriate for Firestore.

Suggested entities:

```text
users
videos
playlists
playlistVideos
tags
videoTags
shares
```

Example:

```text
videos/{videoId}

{
    ownerId,
    platform,
    videoId,
    originalUrl,
    canonicalUrl,
    title,
    thumbnail,
    description,
    creatorName,
    duration,
    publishedAt,
    createdAt,
    updatedAt
}
```

Playlist:

```text
playlists/{playlistId}

{
    ownerId,
    title,
    description,
    thumbnail,
    visibility,
    sortOrder,
    createdAt,
    updatedAt
}
```

Playlist relationship:

```text
playlistVideos/{playlistVideoId}

{
    ownerId,
    playlistId,
    videoId,
    sortOrder,
    addedAt
}
```

Share:

```text
shares/{shareId}

{
    ownerId,
    resourceType,
    resourceId,
    visibility,
    token,
    createdAt,
    updatedAt
}
```

The exact structure may be changed if necessary for Firestore query efficiency.

Do not blindly follow this schema if the existing project already has a better pattern.

---

# 21. Firestore Security

Security is mandatory.

Rules must ensure:

### Private content

Only the owner can read/write.

### Public content

Anyone can read intended public fields.

Only the owner can modify.

### Unlisted content

Access only through the intended share mechanism.

Only the owner can modify.

Users must never be able to:

* Read another user's private videos.
* Modify another user's playlists.
* Delete another user's videos.
* Change another user's visibility.
* Access private notes.

Do not rely on frontend checks.

---

# 22. External Metadata Security

Never expose API keys to the browser.

Preferred:

```text
React
   ↓
Next.js API Route / Server Action
   ↓
Platform Provider
   ↓
Metadata
   ↓
Firestore
```

Implement:

* Timeout
* Error handling
* Rate limiting where necessary
* Caching
* Input validation

Protect against SSRF when accepting external URLs.

Only allow outbound requests to supported/validated domains where possible.

---

# 23. UI/UX Requirements

The application should not look like an admin CRUD dashboard.

Use the existing template to create a polished consumer-facing experience.

Important UX principles:

### Fast

Saving a video should require minimal interaction.

### Clear

Users should immediately understand:

* What platform the video belongs to.
* Where the video will open.
* Which playlist it belongs to.
* Whether it is private/public.

### Responsive

Support:

* Desktop
* Tablet
* Mobile

### States

Implement:

* Loading
* Skeleton
* Empty
* Error
* Success

### Feedback

Use existing toast/snackbar components where available.

---

# 24. Important Development Rules for Copilot Agent

Before implementing a feature:

1. Inspect the existing code.
2. Identify related components/services.
3. Reuse existing patterns.
4. Do not create duplicate utilities.
5. Do not introduce a new dependency unless necessary.
6. Do not rewrite working code unnecessarily.
7. Keep changes focused.
8. Maintain TypeScript type safety.
9. Handle loading/error states.
10. Consider Firestore security implications.
11. Consider mobile UX.
12. Test the affected functionality.

If an existing component already solves part of the problem, extend it instead of creating another competing implementation.

---

# 25. Do Not Implement Yet

The following are future roadmap features.

Do NOT implement unless explicitly requested:

* Channel system
* Followers
* Following users
* Comments
* Likes
* Social feed
* Collaborative playlists
* Browser extension
* Mobile native application
* AI summaries
* AI tagging
* Semantic search
* AI recommendations
* Advanced analytics
* Creator monetization
* Subscription system
* Complex public discovery
* Notifications system
* Video hosting
* Video downloading
* Video uploading

The application should remain a **simple video bookmark manager**.

---

# 26. Future Architecture Principle

Although future features should not be implemented now, avoid architectural decisions that make them impossible later.

For example:

Good:

```text
VideoPlatformProvider
```

Bad:

```text
if (platform === "youtube") {
    // 500 lines of YouTube-specific code
}
```

Good:

```text
ShareableResource
```

Bad:

```text
YouTubeShareOnly
```

Build reusable abstractions where they naturally make sense.

Do not over-engineer the MVP for hypothetical future requirements.

---

# 27. Implementation Workflow

When asked to implement a feature, follow this workflow.

## Step 1 — Understand

Inspect the repository and identify:

* Relevant pages
* Components
* Services
* Firebase configuration
* Firestore usage
* Existing types
* Existing styles
* Existing authentication

## Step 2 — Plan

Before modifying multiple files, briefly identify:

* Files that need changes
* Data model changes
* UI changes
* Security implications
* Any dependencies required

## Step 3 — Implement

Make the smallest clean implementation that satisfies the requirement.

## Step 4 — Validate

Check:

* TypeScript errors
* Build errors
* Existing functionality
* Firebase/Firestore usage
* Security rules
* Loading/error states
* Responsive behavior

## Step 5 — Summarize

After implementation, report:

```text
Implemented:
- ...

Changed:
- ...

Firestore:
- ...

Security:
- ...

Potential follow-up:
- ...
```

Do not implement the follow-up automatically.

---

# 28. Definition of Done

A feature is not complete simply because the UI exists.

A feature is complete when:

* UI works.
* Data persists correctly.
* Loading states work.
* Errors are handled.
* Authentication/authorization works.
* Firestore rules are considered.
* Mobile layout works.
* Existing functionality still works.
* TypeScript/build passes.
* No unnecessary dependencies were introduced.

---

# 29. Product Principle

Always optimize for this experience:

```text
Find video
    ↓
Copy URL
    ↓
Paste URL
    ↓
Metadata automatically appears
    ↓
Choose playlist
    ↓
Save
    ↓
Come back later
    ↓
▶ Watch on YouTube/Facebook/Vimeo/etc.
```

The application should be:

**Simple. Fast. Organized. Private by default. Easy to share.**

The product is fundamentally a **better bookmark manager for videos**, not a social network and not a video hosting service.
