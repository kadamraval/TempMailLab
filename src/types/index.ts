

export interface Email {
  id: string; 
  recipient?: string;
  senderName: string;
  subject: string;
  receivedAt: string;
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
  createdAt: string;
}

export interface Inbox {
  id: string;
  userId: string;
  emailAddress: string;
  createdAt: any; // Can be Date or serverTimestamp
  expiresAt: string;
}
