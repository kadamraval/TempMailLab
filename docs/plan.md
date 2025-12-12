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

## 2. Feature Implementation Details

### General Features

-   **`noAds` (Boolean)**
    -   **Condition**: `plan.features.noAds === true`
    -   **Logic**: The AdSense components (`<AdSenseAd>`, `<BottomAdBanner>`) will check this flag. If `true`, the components will render nothing (`return null`), effectively hiding all ads.

### Inbox Features

-   **`maxInboxes` (Number)**
    -   **Condition**: The number of active inboxes associated with the user's `userId`.
    -   **Logic**: When a user clicks "Create Inbox", a server-side check will count their existing active inboxes. If the count is equal to or greater than `plan.features.maxInboxes`, the creation request will be denied and an error message will be shown to the user.

-   **`availableInboxtimers` (Array of Objects)**
    -   **Condition**: The user's active plan.
    -   **Logic**: The "Inbox Timer" dropdown in the UI will be dynamically populated based on the timers listed in `plan.features.availableInboxtimers`. If a timer in the array has `isPremium: true`, it will be disabled or hidden unless the user's plan is of type `Pro`.

-   **`allowCustomtimer` (Boolean)**
    -   **Condition**: `plan.features.allowCustomtimer === true`
    -   **Logic**: The UI will display the "Custom" timer option and input fields. If `false`, these UI elements will be hidden. A server-side check will also reject any inbox creation request that uses a custom timer if the plan does not permit it.

-   **`customPrefix` (Boolean or Number)**
    -   **Condition**: `plan.features.customPrefix !== false`
    -   **Logic**: The input field allowing the user to type their own inbox prefix will be enabled. If the value is a number, it will represent a limit on how many custom-prefix inboxes can be created (logic to be implemented later). If `false`, the prefix input will be disabled, and the system will only allow auto-generated, random prefixes.

- **`allowStarring` (Boolean)**
    -   **Condition**: `plan.features.allowStarring === true`.
    -   **Logic**: The "Star" icon/button will be visible next to each email. Clicking it will update the email's `isStarred` field in Firestore. If `false`, the star icon will be hidden, and any starring action will be disabled.

- **`allowArchiving` (Boolean)**
    -   **Condition**: `plan.features.allowArchiving === true`.
    -   **Logic**: The "Archive" button/icon will be visible. When an email is archived, it will be hidden from the main inbox view (filtered out on the client-side) and can be viewed in a separate "Archived" filter. If `false`, the archive button will be hidden.

- **`spam` (Boolean)**
    -   **Condition**: `plan.features.spam === true`.
    -   **Logic**: The "Mark as Spam" option will be available. When an email is marked as spam, its `isSpam` flag is set to `true` in Firestore. This can be used to train future spam filters and will move the email to a "Spam" folder/view. If `false`, the option is hidden.

- **`block` (Boolean or Number)**
    -   **Condition**: `plan.features.block !== false`.
    -   **Logic**: The "Block Sender" option will be available. When used, the sender's address is added to a blocklist associated with the user's account. The inbound webhook will check this list and automatically reject new emails from blocked senders. If the value is a number, it represents the maximum number of blocked addresses allowed. If `false`, the block option is hidden.

### Email Features

-   **`maxEmailsPerInbox` (Number)**
    -   **Condition**: `plan.features.maxEmailsPerInbox > 0`
    -   **Logic**: This is a critical **server-side** feature. The inbound email webhook will, before saving a new email, read the `emailCount` on the parent inbox document. If `emailCount` is equal to or greater than `maxEmailsPerInbox`, the webhook will stop and discard the incoming email, preventing the inbox from overflowing.

-   **`allowAttachments` (Boolean)**
    -   **Condition**: `plan.features.allowAttachments === true`
    -   **Logic**: In the `EmailView` component, the section for displaying and downloading attachments will be rendered only if this flag is `true`. The inbound webhook will still process and store attachment metadata regardless, but the UI will control visibility.

- **`delete` (Implicit Feature)**
    -   **Condition**: This is a basic action available to all users for emails they own.
    -   **Logic**: When a user deletes an email, the email document is permanently removed from the `emails` subcollection in Firestore. An associated Cloud Function will then trigger to decrement the `emailCount` on the parent inbox document, ensuring data consistency.

### Custom Domain Features

-   **`customDomains` (Boolean)**
    -   **Condition**: `plan.features.customDomains === true`
    -   **Logic**: The "Custom Domains" page in the user dashboard will be enabled, allowing users to add and manage their domains. If `false`, this page will show a banner prompting the user to upgrade.

-   **`allowPremiumDomains` (Boolean)**
    -   **Condition**: `plan.features.allowPremiumDomains === true`
    -   **Logic**: When populating the domain selection dropdown, the logic will fetch all domains from the `allowed_domains` collection. If this flag is `false`, it will filter out any domains marked with `tier: "premium"`.
