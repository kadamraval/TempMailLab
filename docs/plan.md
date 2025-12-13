

# Subscription Plan Feature Logic

This document details the precise logic for how each feature defined in a subscription plan will be implemented and connected to the application's behavior. This is the definitive blueprint for all development work related to plans and features. All UI/UX is considered final and will not be changed.

---

## 1. Core Principles

### A. Plan Tiers & User Status

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

### B. Premium Feature Upsell Mechanism

-   **UI Logic**: When a feature is disabled due to plan limitations, the corresponding UI element (e.g., button, input field, switch) will be rendered in a `disabled` state.
-   **Interaction Logic**: If a user clicks on one of these disabled premium features, a modal dialog (popup notification) will appear.
-   **Popup Content**: This modal will inform the user that the feature is part of a premium plan. It will contain a brief description of the feature's benefit and a prominent "Upgrade Now" button that links directly to the `/pricing` page.

---

## 2. Feature Implementation Details (Categorized)

### General & Account Features

-   **`noAds` (Boolean) - [COMPLETED]**
    -   **Logic**: The AdSense components (`<AdSenseAd>`, `<BottomAdBanner>`) will check the active plan's `features.noAds` flag. If `true`, the components will render `null`, effectively hiding all advertisements across the application.

-   **`teamMembers` (Number)**
    -   **Logic**: This is a placeholder for future implementation. A "Team" or "Users" section in the user dashboard will be disabled unless `plan.features.teamMembers > 0`. The UI will show "0/X Members" and enable an "Invite Member" button if the limit has not been reached. The popup upsell will be triggered if the user tries to invite more members than the plan allows.

-   **`prioritySupport` (Boolean)**
    -   **Logic**: If `true`, any support requests submitted by the user (e.g., via a contact form) will be flagged with a "priority" field in the backend support queue (e.g., in a Firestore `tickets` collection).

-   **`browserExtension` (Boolean)**
    -   **Logic**: If `true`, the user will be able to download and use the companion browser extension. A check will be performed within the extension by fetching the user's profile to validate their plan. If `false`, the main `/extension` page will still be visible, but the download button will be disabled and will trigger the premium upsell popup.

-   **`usageAnalytics`, `customBranding`, `dedicatedAccountManager` (Booleans)**
    -   **Logic**: These are placeholders for future enterprise-level features. The corresponding sections or pages in the user dashboard will be visible but will show a "Coming Soon" or "Enterprise Only" message and will trigger the premium upsell popup on interaction.

### Inbox Features

-   **`maxInboxes` (Number) - [COMPLETED]**
    -   **Logic**: When a user clicks "Create Inbox", a client-side check against the user's current inbox count from Firestore will be performed. If `user.inboxCount >= plan.features.maxInboxes`, the "Create" button will be disabled and will trigger the premium upsell popup.

-   **`availableInboxtimers` (Array of Objects) - [COMPLETED]**
    -   **Logic**: The "Inbox Timer" dropdown in the UI (`dashboard-client.tsx`) will be dynamically populated based on the timers listed in `plan.features.availableInboxtimers`. Timers marked with `isPremium: true` will be visually distinguished (e.g., with a star icon) and will be disabled if the user's plan type is not `Pro`. Selecting a disabled premium timer will trigger the upsell popup.

-   **`allowCustomtimer` (Boolean) - [COMPLETED]**
    -   **Logic**: The UI will display the "Custom" timer option and input fields only if `plan.features.allowCustomtimer` is `true`. A server-side check will also reject any inbox creation request that uses a custom timer if the plan does not permit it. If `false`, the option will be hidden or disabled, triggering the upsell popup on click.

-   **`customPrefix` (Boolean or Number) - [COMPLETED]**
    -   **Logic**: The input field allowing the user to type their own inbox prefix will be enabled. If the plan value is `false`, the prefix input will be disabled, and the system will only allow auto-generated, random prefixes. Clicking the disabled input will trigger the upsell popup.

-   **`allowStarring` (Boolean) - [COMPLETED]**
    -   **Logic**: The "Star" icon/button next to each email in the list and in the email view will be visible only if `plan.features.allowStarring === true`. Clicking it will update the email's `isStarred` field in Firestore. If `false`, the star icon will be hidden or disabled, and clicking it will trigger the upsell popup.

-   **`allowArchiving` (Boolean) - [COMPLETED]**
    -   **Logic**: The "Archive" button/icon will be visible only if `plan.features.allowArchiving === true`. When an email is archived, it will be hidden from the main inbox view (filtered out on the client-side) and can be viewed in a separate "Archived" filter. If `false`, the button will be disabled and trigger the upsell popup.

### Email Features

-   **`maxEmailsPerInbox` (Number) - [COMPLETED]**
    -   **Logic**: This is a critical **server-side** feature. The inbound email webhook (`src/api/inbound-webhook/route.ts`) will, before saving a new email, read the `emailCount` on the parent inbox document. If `emailCount` is equal to or greater than `maxEmailsPerInbox`, the webhook will stop and discard the incoming email. A value of `0` means unlimited. The user will not be notified in real-time, but their inbox will simply stop receiving new mail.

-   **`allowAttachments` (Boolean) - [COMPLETED]**
    -   **Logic**: In the `EmailView` component, the section for displaying and downloading attachments will be rendered only if this flag is `true`. The inbound webhook will still process and store attachment metadata, but the UI will control visibility. If `false`, this section will be replaced with a message and an "Upgrade to View Attachments" button that triggers the upsell popup.

-   **`delete` (Implicit Feature)**
    -   **Logic**: Deleting an email is a basic action available to all users. When a user deletes an email, the email document is permanently removed from the `emails` subcollection in Firestore. An associated Cloud Function will then trigger to decrement the `emailCount` on the parent inbox document.

-   **`emailForwarding` (Boolean or Number)**
    -   **Logic**: The "Forward" button in the email view will be enabled only if `plan.features.emailForwarding` is not `false`. Clicking it opens a UI to enter a destination email. If `false`, the button is disabled and triggers the upsell popup. If it's a number, a counter will be checked before allowing the forward.

-   **`exportEmails` (Boolean)**
    -   **Logic**: The "Export" or "Download" option for emails will be visible only if `plan.features.exportEmails === true`. This allows users to save emails as `.eml` files. If `false`, the option is disabled and triggers the upsell popup.

-   **`sourceCodeView` (Boolean) - [COMPLETED]**
    -   **Logic**: The "View Source" or "Raw" tab in the `EmailView` component will be visible only if `plan.features.sourceCodeView === true`. This displays the full, raw MIME content of the email. If `false`, the tab will be disabled and trigger the upsell popup.

### Storage & Data Features

-   **`totalStorageQuota` (Number)**
    -   **Logic**: This is a server-side feature. A Cloud Function, triggered on email creation, will calculate the total size of a user's stored emails. If adding a new email would exceed `plan.features.totalStorageQuota` (in MB), the oldest non-starred email will be deleted to make space. A value of `0` means unlimited storage.

-   **`expiredInboxCooldownDays` (Number)**
    -   **Logic**: This is a server-side feature handled by a scheduled Cloud Function. The function queries for inboxes where `expiresAt` is past. It then waits for the specified number of `cooldownDays` before permanently deleting the inbox document and its `emails` subcollection.

### Custom Domain Features

-   **`customDomains` (Boolean)**
    -   **Logic**: The "Custom Domains" page in the user dashboard will be enabled only if `plan.features.customDomains === true`. If `false`, this page will be disabled in the navigation and show the premium upsell banner if accessed directly.

-   **`allowPremiumDomains` (Boolean)**
    -   **Logic**: When populating the domain selection dropdown for inbox creation, the logic will fetch all domains from the `allowed_domains` collection. If `plan.features.allowPremiumDomains` is `false`, it will filter out any domains marked with `tier: "premium"`. These premium domains will still be visible in the dropdown but will be disabled and marked with a star, triggering the upsell popup on selection.

### Security & Privacy Features

-   **`spam` (Boolean)**
    -   **Logic**: The "Mark as Spam" option will be available only if `plan.features.spam === true`. When an email is marked as spam, its `isSpam` flag is set in Firestore, moving it to a "Spam" folder/view. If `false`, the option is disabled and triggers the upsell popup.

-   **`block` (Boolean or Number)**
    -   **Logic**: The "Block Sender" option will be available only if `plan.features.block !== false`. When used, the sender's address is added to a blocklist on the user's document. The inbound webhook will check this list and reject new emails from blocked senders. If disabled, the button triggers the upsell popup.

-   **`passwordProtection` (Boolean or Number)**
    -   **Logic**: An option to "Set Password" on an inbox will be available only if this feature is not `false`. If disabled, it triggers the upsell popup.

-   **`virusScanning` & `linkSanitization` (Booleans)**
    -   **Logic**: These are server-side features. The inbound webhook will pass email content/attachments through a scanning service if these flags are `true`. The result of the scan (e.g., `scanResult: 'clean'` or `scanResult: 'malicious'`) would be stored with the email document, and the UI would display a warning badge if a threat is detected.

### API & Automation Features

-   **`apiAccess` (Boolean)**
    -   **Logic**: A "Developer API" page in the user's dashboard will be enabled only if `plan.features.apiAccess === true`. This page allows the user to generate and manage API keys. Server-side API endpoints will validate these keys against the user's plan. If `false`, the page is disabled and shows the premium upsell banner.

-   **`webhooks` (Boolean)**
    -   **Logic**: If `true`, the user will have access to a UI where they can define a webhook endpoint. The server-side inbound email processor will then forward a JSON payload of the email to the user's defined URL. If `false`, this UI is disabled and shows the upsell popup.

---

## 3. Phased Implementation Strategy

This is how we will connect all the pieces together, step-by-step.

### Phase 1: Solidify the Data Foundation
-   **Database:** Update the `Email` entity in `docs/backend.json` to include all boolean flags (`isStarred`, `isArchived`, `isSpam`, `isBlocked`). **[COMPLETED]**
-   **Admin Panel:** Refactor the `Plan` schema in `src/app/(admin)/admin/packages/data.ts` to correctly handle the full range of features, especially complex ones like numeric toggles and custom timers. **[COMPLETED]**
-   **Application Types:** Update the `Email` type in `src/types/index.ts` to match the new database schema. **[COMPLETED]**

### Phase 2: Implement Core Server-Side Logic
-   **Webhook Enforcement:** Modify the inbound email webhook at `src/api/inbound-webhook/route.ts` to read the user's plan and enforce the `maxEmailsPerInbox` limit. This makes the plans functional. **[COMPLETED]**
-   **User Data Integration:** Update the `useUser` hook in `src/firebase/auth/use-user.tsx` to correctly fetch the user's assigned `planId` and default to the `free-default` plan if none is assigned. This ensures every user operates under the correct feature set. **[COMPLETED]**

### Phase 3: Connect Frontend Logic to Plans
-   **Inbox UI (`dashboard-client.tsx`):** This is the core of the user-facing changes. The component's logic will be updated to:
    -   Read the active plan from the `useUser` hook. **[COMPLETED]**
    -   Dynamically populate the inbox timer dropdown from `plan.features.availableInboxtimers`. **[COMPLETED]**
    -   Show/hide the "Custom Timer" option based on `plan.features.allowCustomtimer`. **[COMPLETED]**
    -   Enable/disable the custom prefix input based on `plan.features.customPrefix`. **[COMPLETED]**
    -   Enable/disable UI elements for starring, archiving, forwarding, etc., based on their respective feature flags. **[COMPLETED]**
    -   Implement the "Premium Upsell" modal dialog for all disabled features.
-   **Admin Plan Form (`plan-form.tsx`):** Update the administrator's plan editor to correctly display and save all the newly defined feature toggles and options from the updated schema. **[COMPLETED]**
-   **Ad System (`adsense-ad.tsx`):** Connect AdSense components to the `noAds` flag. **[COMPLETED]**
-   **Email View (`email-view.tsx`):** Connect attachment visibility and source code view to plan features. **[COMPLETED]**
