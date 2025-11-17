# TempInbox: Definitive Development Plan

This document is the single source of truth for the application's architecture, logic, and user flows. It supersedes all previous blueprints and discussions.

---

## **Architectural Blueprint: A Modern, Integrated System**

Our system uses a modern Next.js architecture with Server Actions, which simplifies development and enhances security.

1.  **The Application Layer (AI Responsibility):** This is the Next.js application that users and administrators interact with. The AI will build and manage 100% of this layer.
    *   **Technology:** Next.js, React, Tailwind CSS, ShadCN UI.
    *   **Backend-for-Frontend:** Firebase (Authentication, Firestore).
    *   **Core Functions:** The AI is responsible for the entire user interface, admin panel, real-time inbox display, and the core logic for generating email addresses and fetching messages.
    *   **Server Actions:** Instead of separate cloud functions, we use secure Server Actions (`'use server'`) within the Next.js app to communicate with third-party services like Mailgun. This code lives in `src/lib/actions/` and is never exposed to the user's browser.

2.  **The Service Layer (Your Responsibility):** This is the external email-receiving service. You are responsible for setting up this service and providing the necessary credentials to the application via the admin panel.
    *   **Technology:** Mailgun.
    *   **Core Functions:** You provide a Mailgun API Key and a configured Domain. The application uses these credentials to fetch emails.

This integrated approach is clean, secure, and highly efficient.

---

## **End-to-End Development Roadmap**

This tracks the major features we have built together.

### **Phase 1: Foundation & Configuration (✅ Complete)**

**Goal:** Establish the administrative controls and connect your Mailgun service to the application.

*   **Build Mailgun Integration Settings Page (✅ Complete)**
    *   The secure form at `/admin/settings/integrations/mailgun` allows you to save your Mailgun API Key and Domain to Firestore.

*   **Build the "Domain Pool" Management UI (✅ Complete)**
    *   The UI at `/admin/domain` allows you to define the pool of domains that the application can use to generate temporary email addresses.

### **Phase 2: The Core User Experience (✅ Complete)**

**Goal:** Build the main temp-mail generator for your end-users.

*   **Implement Inbox Generation Logic (✅ Complete)**
    *   The "Generate New Email" functionality is implemented in the main dashboard client. It fetches the "Allowed Domains" list, randomly selects a domain, generates a unique address, and creates the inbox session.

*   **Implement On-Demand Email Fetching (✅ Complete)**
    *   The `fetchEmailsWithCredentialsAction` Server Action securely uses your saved Mailgun credentials to fetch new emails on demand.

*   **Build the Real-Time Inbox Display (✅ Complete)**
    *   The application client now automatically refreshes the inbox, displaying new emails as they are fetched from the server.

### **Phase 3: Security & Billing (In Progress)**

**Goal:** Harden the system, add monetization, and ensure long-term stability.

*   **Implement Security Rules & User Plans (✅ Complete)**
    *   Firestore Security Rules have been written to ensure users can only access their own data.
    *   A full subscription plan management system has been built at `/admin/packages`, allowing for granular feature control.

*   **Implement Inbox Cleanup (Future Task)**
    *   An `expiresAt` timestamp is added to every inbox session. A future task will be to set up a scheduled job (cron job) to periodically delete expired inboxes from the database.

---

## **Core Logic & User Flows**

This section details the precise logic for how users interact with the system.

### **Principle: Default to the "Free" Plan**

The application has one critical default plan stored in Firestore with the ID `free-default`.

*   **Anonymous Users (Not Logged In):** All anonymous users will **always** use the `free-default` plan's settings.
*   **Registered Users (Logged In):** A registered user will use the `free-default` plan **unless** an administrator has explicitly assigned a different plan to their user document in the database.

### **User Flow 1: The Anonymous User Session**

This flow details the experience for a first-time or logged-out visitor.

1.  **Initial Visit:** A new user visits the site.
2.  **Fetch Free Plan:** The inbox component (`DashboardClient`) fetches the `plans/free-default` document from Firestore.
3.  **Generate Inbox:** Using the settings from the `free-default` plan (e.g., `inboxLifetime`), the system generates a new temporary email address.
4.  **Save to Local Storage:** The system saves the current inbox details (email address, creation time, expiration time) to the browser's `localStorage`.
5.  **Session Persistence:** If the user refreshes the page or closes and reopens the browser, the inbox component will first check `localStorage`.
    *   If a valid, non-expired inbox is found, it will be restored, ensuring the user keeps their session.
    *   If no inbox is found or it has expired, the system returns to Step 3.

### **User Flow 2: Anonymous User Registers or Logs In**

This flow details the seamless transition from an anonymous session to a registered account.

1.  **Initiate Action:** An anonymous user with an active temporary inbox (from Flow 1) clicks "Sign Up" or "Log In".
2.  **Authentication:** The user completes the standard Firebase Authentication process (e.g., with Google or email/password).
3.  **Account Creation (on Server):** Upon successful authentication, the client calls the `signUp` server action.
    *   The server action creates a new `user` document in Firestore if one doesn't already exist.
    *   **Crucially, the server assigns the existing anonymous inbox to the new user.** The system will read the inbox ID from the client's `localStorage` and save it to the user's new document in the database.
4.  **Session Transition:** The user is now logged in. Their temporary inbox from their anonymous session is now associated with their permanent account and will be governed by their assigned plan (which is `free-default` to start).

### **User Flow 3: The Registered User Session**

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