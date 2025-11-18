
import type { Timestamp } from "firebase/firestore";

export interface Email {
  id: string; 
  inboxId: string;
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
}

export interface User {
  uid: string;
  email: string | null;
  planId?: string; 
  createdAt?: Timestamp | any;
  isAdmin?: boolean;
  isAnonymous?: boolean;
  displayName?: string;
  photoURL?: string;
}

export interface Inbox {
  id: string;
  userId: string;
  emailAddress: string;
  createdAt: any; // Can be Date or serverTimestamp
  expiresAt: string;
  ownerToken?: string;
}
