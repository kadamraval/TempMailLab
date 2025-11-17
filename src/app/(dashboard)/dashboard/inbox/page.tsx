'use client';

import { UserInboxClient } from "./user-inbox-client"; 

export default function UserInboxPage() {
  // This page is now just a container for the client component.
  // The client component handles its own data fetching.
  return (
    <UserInboxClient />
  );
}
