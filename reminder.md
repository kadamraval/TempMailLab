# Application Core Principles & Data Flow

This document is the definitive source of truth for the application's core user flow and data management. It must be strictly followed to prevent application hangs, permission errors, and webhook failures.

## 1. User Types & Data Storage

- **Anonymous (Guest) User**:
  - **Definition**: A user signed in with Firebase Anonymous Authentication (`signInAnonymously`). They have a temporary, unique `uid`.
  - **Inbox Storage**: All inboxes created by a guest MUST be saved as documents in the main `/inboxes` collection in Firestore, associated with their anonymous `uid`.
  - **Session Storage**: To persist a guest's session across page reloads, the `id` of their active inbox document (from Firestore) MUST be stored in the browser's `localStorage`. The application will read this ID on load to fetch the correct inbox from the database.

- **Registered User**:
  - **Definition**: A user signed in via a standard Firebase provider (Email/Password, Google, etc.).
  - **Inbox Storage**: All inboxes created by a registered user MUST be saved as documents in the main `/inboxes` collection in Firestore, associated with their permanent `uid`.
  - **Data Transition**: When a guest registers, the application MUST find all inboxes associated with their old anonymous `uid` and update the `userId` field on those documents to their new, permanent `uid`.

## 2. Definitive Application Loading Flow (The "Why It Works" Logic)

The application follows a strict, three-layer loading sequence to prevent race conditions and loading hangs.

- **Layer 1: `FirebaseProvider` (Raw Authentication)**
  - **Responsibility**: This is the foundational layer. Its ONLY job is to wrap Firebase's `onAuthStateChanged` listener.
  - **Output**: It provides the raw `user` object (which will exist for BOTH guests and registered users) and a simple loading flag (`isUserLoading`) that is `true` only during the initial Firebase auth check.
  - **Constraint**: It does NOT fetch any database data (like user profiles or plans).

- **Layer 2: `useUser` Hook (Profile Hydration)**
  - **Responsibility**: This hook consumes the raw `user` from Layer 1 and enriches it with database information.
  - **Logic Flow**:
    1. It first waits for the `isUserLoading` flag from Layer 1 to become `false`.
    2. **If `user` is an Anonymous Guest**: It IMMEDIATELY creates a local, temporary `userProfile` object and fetches the single `plans/free-default` document. This process is nearly instant.
    3. **If `user` is Registered**: It proceeds to fetch the user's specific document from the `users` collection and their assigned plan from the `plans` collection.

- **Layer 3: `AuthProvider` (App Render Gatekeeper)**
  - **Responsibility**: This component orchestrates the entire sequence and prevents the UI from rendering prematurely.
  - **Logic Flow**:
    1. It waits for the `isUserLoading` flag from the `useUser` hook to become `false`.
    2. Because of the logic in Layer 2, this flag now correctly accounts for the completion of both guest and registered user flows.
    3. Only when this final loading state is `false` does it render the main application `children`. This guarantees that any component, like `DashboardClient`, receives a fully resolved and valid `userProfile` object from the moment it mounts.

## 3. UI Integrity

- **No Design Changes**: The UI/UX, particularly in `dashboard-client.tsx`, is considered final. My role is to make the existing static design dynamic and functional. I MUST NOT add, remove, or change any visual elements of the design unless explicitly instructed to do so.
