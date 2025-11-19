
import type { Timestamp } from "firebase/firestore";

export interface Email {
  id: string; 
  inboxId: string;
  userId: string; // Denormalized for security rules
  recipient?: string;
  senderName: string;
  subject: string;
  receivedAt: string | Timestamp; // Allow both for client/server
  htmlContent?: string;
  textContent?: string;
  rawContent?: string;
  attachments?: {
    "content-type": string;
    filename: string;
    size: number;
    url: string;
  }[];
  read?: boolean;
  ownerToken?: string; // For anonymous security rule
}

export interface User {
  uid: string;
  email: string | null;
  planId?: string; 
  createdAt?: Timestamp;
  isAdmin?: boolean;
  isAnonymous?: boolean;
  displayName?: string;
  photoURL?: string;
}

export interface Inbox {
  id: string;
  userId: string;
  emailAddress: string;
  createdAt: Timestamp; // Ensure this is a Timestamp for sorting
  expiresAt: string;
  ownerToken?: string;
}
