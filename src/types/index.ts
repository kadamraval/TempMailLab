import type { Timestamp } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";

export interface Email {
  id: string; 
  inboxId: string;
  userId: string; // Denormalized for security rules
  senderName: string;
  subject: string;
  receivedAt: string | Timestamp; // Allow both for client/server
  createdAt: Timestamp;
  htmlContent?: string;
  textContent?: string;
  rawContent?: string;
  attachments?: {
    filename: string;
    contentType: string;
    size: number;
    url: string; 
  }[];
  read?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isSpam?: boolean;
  isBlocked?: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName?: string;
  inboxCount?: number;
  planId?: string; 
  plan?: Plan | null; // Changed to allow null
  isAdmin?: boolean;
  isAnonymous?: boolean;
  photoURL?: string;
  createdAt?: Timestamp;
}

export interface Inbox {
  id: string;
  userId: string;
  emailAddress: string;
  domain: string;
  emailCount: number;
  createdAt?: Timestamp; // Make optional for client-side creation
  expiresAt: string;
  isStarred?: boolean;
  isArchived?: boolean;
}
