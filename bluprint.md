# TempInbox: Architectural Blueprint & Development Roadmap

This document outlines the professional plan for building the TempInbox custom temporary email service. It defines the system architecture, the separation of responsibilities, and a phased development roadmap.

## **Architectural Blueprint: A Two-Layer System**

Our system will have two distinct layers that communicate via a secure API and a shared database (Firestore).

1.  **The Application Layer (AI Responsibility):** This is the Next.js application that users interact with. The AI will build and manage 100% of this layer.
    *   **Technology:** Next.js, React, Tailwind CSS, Server Actions.
    *   **Backend-for-Frontend:** Firebase (Authentication, Firestore).
    *   **Core Functions:** User registration/login, admin panel, inbox generation, real-time display of emails, and invoking backend services via Server Actions.

2.  **The Service & Infrastructure Layer (Your Responsibility):** This is the backend engine that receives and processes emails. You will set this up, and the AI will provide the interface (in the admin panel) to connect it to the application.
    *   **Technology:** Mailgun.
    *   **Core Functions:** Providing API keys and a configured domain for receiving emails.

This separation is clean, secure, and scalable.

---

## **End-to-End Development Roadmap**

We will build the system in three distinct phases.

### **Phase 1: Admin Foundation & Service Configuration**

**Goal:** Before any user features are built, we must establish the administrative control center. This phase empowers you to connect your infrastructure to the application.

*   **AI's Task 1: Build the Mailgun Integration Settings Page.**
    *   The AI will create a new page at `/admin/settings/integrations/mailgun`.
    *   This page will contain a secure form for you to enter:
        1.  Your Mailgun API Key.
        2.  Your Mailgun Domain (e.g., `mg.yourdomain.com`).
    *   The AI will write the code to save these values securely into a dedicated, admin-only document in Firestore.

*   **Your Task 1: Set up Mailgun.**
    *   **Action:** Create a Mailgun account. Add and verify a domain/subdomain you will use for receiving emails (e.g., `mg.yourdomain.com`).
    *   **Result Needed for Admin Panel:** Your Mailgun API Key and the domain name.

*   **AI's Task 2: Build the Domain Management UI.**
    *   The AI will build the UI at `/admin/domain` for you to specify which domains our application is allowed to use when generating temporary email addresses.

---

### **Phase 2: The Core User Experience**

**Goal:** With the admin foundation in place, we will now build the temp-mail generator for your users.

*   **AI's Task 3: Implement Inbox Generation.**
    *   The AI will create the "Generate New Email" functionality on the main dashboard.
    *   This action will read the "Allowed Domains" from Firestore, generate a unique address, and create a new `inbox` document in Firestore, linked to the user's ID.

*   **AI's Task 4: Implement On-Demand Email Fetching.**
    *   The AI will create a "Refresh" button in the user's inbox view.
    *   When clicked, the code will execute a Server Action (`fetchEmailsFromServerAction`) that securely:
        1.  Reads the Mailgun settings from Firestore.
        2.  Uses the Mailgun API to fetch new emails.
        3.  Sanitizes them and writes them to the database.

*   **AI's Task 5: Build the Real-Time Inbox Display.**
    *   The AI will use Firestore's real-time `useCollection` hook to listen for changes to the user's inbox collection.
    *   When the Server Action writes new emails to Firestore, they will appear instantly in the UI.

---

### **Phase 3: Security, Billing & Maintenance**

**Goal:** Harden the system, add monetization, and ensure long-term stability.

*   **AI's Task 6: Implement Security Rules & User Quotas.**
    *   The AI will write strict Firestore Security Rules to guarantee that users can only access their own inboxes.
    *   The AI will build the UI for managing Plans (Free, Pro) and write application logic to enforce plan limits (e.g., a "Free" user can only have one active inbox at a time).

*   **AI's Task 7: Implement Cleanup Timestamps.**
    *   The AI will add an `expiresAt` timestamp to every inbox document created.

*   **Your Task 2: Set up the Cleanup Cron Job.**
    *   **Action:** In Google Cloud Scheduler, create a cron job that runs periodically (e.g., every hour).
    *   **Job Logic:** This job should trigger a simple Cloud Function that queries Firestore for all `inbox` documents where `expiresAt` is in the past and deletes them and their associated emails.
