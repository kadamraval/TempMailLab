# Application Core Principles

This document is the definitive source of truth for the application's core user flow, as directed.

## 1. Anonymous (Guest) User Data

- **Storage**: All data for anonymous users MUST be stored exclusively in the browser's `localStorage`.
- **No Firebase Anonymous Authentication**: The application MUST NOT use Firebase's `signInAnonymously()` feature. A guest user is one for whom the Firebase `auth` object reports `null` for the current user.
- **Session Management**: The `DashboardClient` component is responsible for reading from and writing to `localStorage` to manage the guest session, including the active inbox and its emails.

## 2. Registered User Data

- **Storage**: All data for registered users (signed in with Email/Password, Google, etc.) MUST be stored in Firestore.
- **Data Transition**: When a guest user registers, the application MUST transition their active inbox data from `localStorage` into their new, permanent user account in Firestore.

## 3. UI Integrity

- **No Design Changes**: The UI/UX, particularly in `dashboard-client.tsx`, is considered final. My role is to make the existing static design dynamic and functional. I MUST NOT add, remove, or change any visual elements of the design unless explicitly instructed to do so.
