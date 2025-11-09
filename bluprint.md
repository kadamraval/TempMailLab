# TempInbox: Architectural Blueprint & Development Roadmap

This document outlines the professional plan for building the TempInbox custom temporary email service. It defines the system architecture, the separation of responsibilities, and a phased development roadmap.

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

We will build the system in three distinct phases.

### **Phase 1: Foundation & Configuration (In Progress)**

**Goal:** Establish the administrative controls and connect your Mailgun service to the application.

*   **AI's Task 1: Build Mailgun Integration Settings Page (✅ Complete)**
    *   The AI has built the secure form at `/admin/settings/integrations/mailgun`.
    *   This allows you to save your Mailgun API Key and Domain securely to Firestore.

*   **Your Task 1: Set up Mailgun & Connect It (✅ Complete)**
    *   You have created a Mailgun account and entered your API key and domain into the application's admin panel.

*   **AI's Task 2: Build the "Domain Pool" Management UI (In Progress)**
    *   The AI is building the UI at `/admin/domain`. This is where you will define the pool of domains that the application can use to generate temporary email addresses.
    *   **Your Next Step:** Once the AI completes this task, you will add at least one of your Mailgun-verified domains to this list (e.g., `mg.yourdomain.com`).

---

### **Phase 2: The Core User Experience**

**Goal:** Build the main temp-mail generator for your end-users.

*   **AI's Task 3: Implement Inbox Generation Logic.**
    *   The AI will create the "Generate New Email" functionality on the user-facing dashboard.
    *   This action will:
        1.  Fetch the "Allowed Domains" list you created in Phase 1.
        2.  Randomly select one domain from the list.
        3.  Generate a unique, random prefix (e.g., `xy2z9a`).
        4.  Combine them into a full email address (`xy2z9a@your-allowed-domain.com`).
        5.  Create a corresponding `inbox` document in Firestore, linking the new address to the user ID and setting an expiration time.

*   **AI's Task 4: Implement On-Demand Email Fetching (✅ Complete)**
    *   The `fetchEmailsFromServerAction` is already built. When a user clicks "Refresh", this Server Action securely uses your saved Mailgun credentials to fetch new emails for their specific address.

*   **AI's Task 5: Build the Real-Time Inbox Display (✅ Complete)**
    *   The app already uses Firestore's real-time `useCollection` hook. When the Server Action saves new emails to the database, they will appear instantly in the user's UI.

---

### **Phase 3: Security, Billing & Maintenance**

**Goal:** Harden the system, add monetization, and ensure long-term stability.

*   **AI's Task 6: Implement Security Rules & User Quotas.**
    *   The AI will write strict Firestore Security Rules to guarantee that users can only access their own inboxes and data.
    *   The AI will build the UI for managing subscription plans (e.g., Free, Pro) and write application logic to enforce plan limits (e.g., a "Free" user can only have one active inbox at a time).

*   **AI's Task 7: Implement Inbox Cleanup.**
    *   The AI has already added an `expiresAt` timestamp to every inbox document created.
    *   **A cron job (scheduled task) will be required** to periodically query Firestore and delete expired inboxes and their associated emails. The AI will provide guidance on setting this up in Google Cloud Scheduler when we reach this stage.
