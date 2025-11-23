import type { Timestamp } from "firebase-admin/firestore";

export interface Email {
  id: string; 
  inboxId: string;
  userId: string; 
  senderName: string;
  subject: string;
  receivedAt: Timestamp;
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
