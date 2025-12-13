# Application Core Principles & Data Flow

This document is the definitive source of truth for the application's core user flow and data management. It must be strictly followed to prevent application hangs and permission errors.

## 1. User Types & Data Storage

- **Anonymous (Guest) User**:
  - **Definition**: A user for whom the Firebase Auth `user` object is `null`. The application MUST NOT use Firebase Anonymous Authentication (`signInAnonymously`).
  - **Storage**: All session data for a guest (e.g., their temporary inbox) MUST be stored exclusively in the browser's `localStorage`.
  - **Database Interaction**: Guest sessions MUST NOT attempt to write to Firestore, except for read-only operations on public collections like `plans`.

- **Registered User**:
  - **Definition**: A user signed in via a standard Firebase provider (Email/Password, Google, etc.).
  - **Storage**: All user data MUST be stored in Firestore.
  - **Data Transition**: When a guest registers, the application MUST transition their active inbox data from `localStorage` to their new user account in Firestore.

## 2. Definitive Application Loading Flow (The "Why It Works" Logic)

The application follows a strict, three-layer loading sequence to prevent race conditions and loading hangs.

- **Layer 1: `FirebaseProvider` (Raw Authentication)**
  - **Responsibility**: This is the foundational layer. Its ONLY job is to wrap Firebase's `onAuthStateChanged` listener.
  - **Output**: It provides the raw `user` object (or `null` for guests) and a simple loading flag (`isUserLoading`) that is `true` only during the initial Firebase auth check.
  - **Constraint**: It does NOT fetch any database data (like user profiles or plans).

- **Layer 2: `useUser` Hook (Profile Hydration)**
  - **Responsibility**: This hook consumes the raw `user` from Layer 1 and enriches it with database information.
  - **Logic Flow**:
    1. It first waits for the `isUserLoading` flag from Layer 1 to become `false`.
    2. It then checks the `user` object.
    3. **If `user` is `null` (Guest)**: It IMMEDIATELY creates a local, temporary `userProfile` object and fetches the single `plans/free-default` document. This process is nearly instant.
    4. **If `user` exists (Registered)**: It proceeds to fetch the user's specific document from the `users` collection and their assigned plan from the `plans` collection.

- **Layer 3: `AuthProvider` (App Render Gatekeeper)**
  - **Responsibility**: This component orchestrates the entire sequence and prevents the UI from rendering prematurely.
  - **Logic Flow**:
    1. It waits for the `isUserLoading` flag from the `useUser` hook to become `false`.
    2. Because of the logic in Layer 2, this flag now correctly accounts for the completion of both guest and registered user flows.
    3. Only when this final loading state is `false` does it render the main application `children`. This guarantees that any component, like `DashboardClient`, receives a fully resolved and valid `userProfile` object from the moment it mounts.

## 3. UI Integrity

- **No Design Changes**: The UI/UX, particularly in `dashboard-client.tsx`, is considered final. My role is to make the existing static design dynamic and functional. I MUST NOT add, remove, or change any visual elements of the design unless explicitly instructed to do so.
