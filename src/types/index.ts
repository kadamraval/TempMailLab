

export interface Email {
  id: string; 
  from?: string; // Mailgun might just have a 'sender'
  senderName?: string;
  subject: string;
  date?: string; // Will be set by server
  receivedAt: string;
  body?: string;
  htmlContent?: string;
  textContent?: string;
  read?: boolean;
}

export interface MailTmAccount {
    id: string;
    email: string;
    token: string;
}

export interface User {
  uid: string;
  email: string | null;
  isPremium: boolean;
  planType: 'free' | 'premium';
  createdAt: string;
  inboxCount?: number;
}

export interface Inbox {
  id: string;
  userId: string;
  emailAddress: string;
  createdAt: string;
  expiresAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  status: 'active' | 'archived';
  cycle: 'monthly' | 'yearly';
}
