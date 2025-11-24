
import type { Timestamp } from "firebase/firestore";

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
  domain: string;
  emailCount: number;
  createdAt?: Timestamp; // Make optional for client-side creation
  expiresAt: string;
}
    
