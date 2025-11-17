# TempInbox: Definitive Development Plan

This document is the single source of truth for the application's core logic and user flows. It supersedes all previous blueprints and discussions.

---

## **Core Principle: Default to the "Free" Plan**

The application has one critical default plan stored in Firestore with the ID `free-default`.

*   **Anonymous Users (Not Logged In):** All anonymous users will **always** use the `free-default` plan's settings.
*   **Registered Users (Logged In):** A registered user will use the `free-default` plan **unless** an administrator has explicitly assigned a different plan to their user document in the database.

---

## **User Flow 1: The Anonymous User Session**

This flow details the experience for a first-time or logged-out visitor.

1.  **Initial Visit:** A new user visits the site.
2.  **Fetch Free Plan:** The inbox component (`DashboardClient`) fetches the `plans/free-default` document from Firestore.
3.  **Generate Inbox:** Using the settings from the `free-default` plan (e.g., `inboxLifetime`), the system generates a new temporary email address.
4.  **Save to Local Storage:** The system saves the current inbox details (email address, creation time, expiration time) to the browser's `localStorage`.
5.  **Session Persistence:** If the user refreshes the page or closes and reopens the browser, the inbox component will first check `localStorage`.
    *   If a valid, non-expired inbox is found, it will be restored, ensuring the user keeps their session.
    *   If no inbox is found or it has expired, the system returns to Step 3.

---

## **User Flow 2: Anonymous User Registers or Logs In**

This flow details the seamless transition from an anonymous session to a registered account.

1.  **Initiate Action:** An anonymous user with an active temporary inbox (from Flow 1) clicks "Sign Up" or "Log In".
2.  **Authentication:** The user completes the standard Firebase Authentication process (e.g., with Google or email/password).
3.  **Account Creation (on Server):** Upon successful authentication, the client calls the `signUp` server action.
    *   The server action creates a new `user` document in Firestore if one doesn't already exist.
    *   **Crucially, the server assigns the existing anonymous inbox to the new user.** The system will read the inbox ID from the client's `localStorage` and save it to the user's new document in the database.
4.  **Session Transition:** The user is now logged in. Their temporary inbox from their anonymous session is now associated with their permanent account and will be governed by their assigned plan (which is `free-default` to start).

---

## **User Flow 3: The Registered User Session**

This flow details the experience for a returning, logged-in user.

1.  **User Logs In:** A registered user logs into the application.
2.  **Identify User's Plan:**
    *   The system checks the user's document in the `users` collection in Firestore.
    *   It looks for a `planId` field. If this field exists and points to a valid plan, the system fetches that specific plan's document.
    *   If the `planId` field does **not** exist, the system defaults to fetching the `plans/free-default` document.
3.  **Display Inbox:**
    *   The system checks if the user already has an active inbox associated with their account in the database.
    *   If an active inbox exists, it is displayed.
    *   If no active inbox exists, the system uses the settings from the user's identified plan (from Step 2) to generate a new one.

This plan is now our definitive guide. My next steps will be to implement these flows exactly as described.