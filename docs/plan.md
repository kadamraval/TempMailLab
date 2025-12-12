# Subscription Plan Feature Logic

This document details the precise logic for how each feature defined in a subscription plan will be implemented and connected to the application's behavior. This is the definitive blueprint for all development work related to plans and features. All UI/UX is considered final and will not be changed.

---

## 1. Core Plan Types

The system revolves around three core user and plan types. The application logic will check the user's status and their assigned `planId` to determine which rules to apply.

-   **`Guest` (Anonymous Users)**
    -   **Condition**: User is not logged in (`user.isAnonymous === true`).
    -   **Logic**: The application will **always** use the plan with the ID `free-default`. All temporary inbox data (like the current inbox ID and its expiration) will be saved to the browser's `localStorage`. This allows the session to persist across page refreshes.

-   **`Freemium` (Registered, Free Users)**
    -   **Condition**: User is logged in and has **no** `planId` set on their user document in Firestore, or their `planId` is explicitly set to `free-default`.
    -   **Logic**: The application will use the `free-default` plan. Inbox data is saved to their user account in Firestore, not `localStorage`.

-   **`Pro` (Registered, Paid Users)**
    -   **Condition**: User is logged in and has a `planId` on their user document that corresponds to a paid plan (e.g., "pro-monthly", "pro-yearly").
    -   **Logic**: The application will fetch and use the specific plan document assigned to the user. All features will be determined by this plan.

---

## 2. Feature Implementation Details (Categorized)

### General & Account Features

-   **`noAds` (Boolean)**
    -   **Logic**: The AdSense components (`<AdSenseAd>`, `<BottomAdBanner>`) will check the active plan's `features.noAds` flag. If `true`, the components will render `null`, effectively hiding all advertisements across the application.

-   **`teamMembers` (Number)**
    -   **Logic**: This is a placeholder for future implementation. The logic will involve inviting other users to share a plan's benefits, but it is not part of the current scope.

-   **`prioritySupport` (Boolean)**
    -   **Logic**: If `true`, any support requests submitted by the user will be flagged as "priority" in the admin support queue. This is a backend flag.

-   **`browserExtension` (Boolean)**
    -   **Logic**: If `true`, the user will be able to download and use the companion browser extension. A check will be performed within the extension to validate the user's plan.

-   **`usageAnalytics`, `customBranding`, `dedicatedAccountManager` (Booleans)**
    -   **Logic**: These are placeholders for future enterprise-level features and will not be implemented in the current scope.

### Inbox Features

-   **`maxInboxes` (Number)**
    -   **Logic**: When a user clicks "Create Inbox", a server-side check (or a client-side check against the user's current inbox count from Firestore) will count their active inboxes. If the count is equal to or greater than `plan.features.maxInboxes`, the creation UI will be disabled or show an error message.

-   **`availableInboxtimers` (Array of Objects)**
    -   **Logic**: The "Inbox Timer" dropdown in the UI (`dashboard-client.tsx`) will be dynamically populated based on the timers listed in `plan.features.availableInboxtimers`. Timers marked with `isPremium: true` will be disabled or hidden unless the user's plan type is `Pro`.

-   **`allowCustomtimer` (Boolean)**
    -   **Logic**: The UI will display the "Custom" timer option and input fields only if `plan.features.allowCustomtimer` is `true`. A server-side check will also reject any inbox creation request that uses a custom timer if the plan does not permit it.

-   **`customPrefix` (Boolean or Number)**
    -   **Logic**: The input field allowing the user to type their own inbox prefix will be enabled. If the value is a number, it will represent a limit on how many custom-prefix inboxes can be created (logic to be implemented later). If `false`, the prefix input will be disabled, and the system will only allow auto-generated, random prefixes.

-   **`allowStarring` (Boolean)**
    -   **Logic**: The "Star" icon/button next to each email in the list and in the email view will be visible only if `plan.features.allowStarring === true`. Clicking it will update the email's `isStarred` field in Firestore. If `false`, the star icon will be hidden.

-   **`allowArchiving` (Boolean)**
    -   **Logic**: The "Archive" button/icon will be visible only if `plan.features.allowArchiving === true`. When an email is archived, it will be hidden from the main inbox view (filtered out on the client-side) and can be viewed in a separate "Archived" filter.

### Email Features

-   **`maxEmailsPerInbox` (Number)**
    -   **Logic**: This is a critical **server-side** feature. The inbound email webhook (`src/api/inbound-webhook/route.ts`) will, before saving a new email, read the `emailCount` on the parent inbox document. If `emailCount` is equal to or greater than `maxEmailsPerInbox`, the webhook will stop and discard the incoming email, preventing the inbox from overflowing. A value of `0` means unlimited.

-   **`allowAttachments` (Boolean)**
    -   **Logic**: In the `EmailView` component, the section for displaying and downloading attachments will be rendered only if this flag is `true`. The inbound webhook will still process and store attachment metadata regardless, but the UI will control visibility.

- **`delete` (Implicit Feature)**
    -   **Logic**: This is a basic action available to all users for emails they own. When a user deletes an email, the email document is permanently removed from the `emails` subcollection in Firestore. An associated Cloud Function will then trigger to decrement the `emailCount` on the parent inbox document.

-   **`emailForwarding` (Boolean or Number)**
    -   **Logic**: The "Forward" button in the email view will be enabled only if `plan.features.emailForwarding` is not `false`. This will open a UI for the user to enter a destination email address. If the value is a number, it represents a limit on the number of forwards allowed.

-   **`exportEmails` (Boolean)**
    -   **Logic**: The "Export" or "Download" option for emails will be visible only if `plan.features.exportEmails === true`. This allows users to save emails as `.eml` files.

-   **`sourceCodeView` (Boolean)**
    -   **Logic**: The "View Source" or "Raw" tab in the `EmailView` component will be visible only if `plan.features.sourceCodeView === true`. This displays the full, raw MIME content of the email.

### Storage & Data Features

-   **`totalStorageQuota` (Number)**
    -   **Logic**: A server-side check, likely a Cloud Function triggered on email creation, will calculate the total size of a user's stored emails. If adding a new email would exceed the `plan.features.totalStorageQuota` (in MB), the oldest non-starred email will be deleted to make space. A value of `0` means unlimited.

-   **`expiredInboxCooldownDays` (Number)**
    -   **Logic**: This is a server-side feature handled by a scheduled Cloud Function. The function will query for inboxes where `expiresAt` is past. It will then wait for the specified number of `cooldownDays` before permanently deleting the inbox document and its `emails` subcollection.

### Custom Domain Features

-   **`customDomains` (Boolean)**
    -   **Logic**: The "Custom Domains" page in the user dashboard will be enabled only if `plan.features.customDomains === true`. If `false`, this page will show a banner prompting the user to upgrade.

-   **`allowPremiumDomains` (Boolean)**
    -   **Logic**: When populating the domain selection dropdown for inbox creation, the logic will fetch all domains from the `allowed_domains` collection. If `plan.features.allowPremiumDomains` is `false`, it will filter out any domains marked with `tier: "premium"`.

### Security & Privacy Features

-   **`spam` (Boolean)**
    -   **Logic**: The "Mark as Spam" option will be available only if `plan.features.spam === true`. When an email is marked as spam, its `isSpam` flag is set to `true` in Firestore. This will move the email to a "Spam" folder/view.

-   **`block` (Boolean or Number)**
    -   **Logic**: The "Block Sender" option will be available only if `plan.features.block !== false`. When used, the sender's address is added to a blocklist associated with the user's account. The inbound webhook will check this list and automatically reject new emails from blocked senders. If the value is a number, it represents the maximum number of blocked addresses allowed.

-   **`passwordProtection` (Boolean or Number)**
    -   **Logic**: This feature will allow users to set a password on a specific inbox, requiring it to be entered before viewing contents. The UI for this will only be enabled if this feature is not `false`.

-   **`virusScanning` & `linkSanitization` (Booleans)**
    -   **Logic**: These are server-side features. The inbound webhook will pass email content/attachments through a (hypothetical) scanning service if these flags are `true` on the user's plan. The result of the scan would be stored with the email document.

### API & Automation Features

-   **`apiAccess` (Boolean)**
    -   **Logic**: A "Developer API" page will be visible in the user's dashboard only if `plan.features.apiAccess === true`. This page will allow the user to generate and manage API keys. Server-side API endpoints will validate these keys against the user's plan before processing requests.

-   **`webhooks` (Boolean)**
    -   **Logic**: If `true`, the user will have access to a UI where they can define a webhook endpoint. The server-side inbound email processor will then, in addition to saving the email, forward a JSON payload of the email to the user's defined URL.
