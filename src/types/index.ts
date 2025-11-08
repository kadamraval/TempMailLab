
export interface Email {
  id: string; // mail.tm uses string IDs
  from: string;
  subject: string;
  date: string;
  body?: string;
  htmlBody?: string;
  read?: boolean;
}

export interface MailTmAccount {
    id: string;
    email: string;
    token: string;
}

export interface User {
  uid: string;
  email: string;
  isPremium: boolean;
  planType: 'free' | 'premium';
  createdAt: string;
  inboxCount: number;
}

export interface InboxLog {
  id: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  emailCount: number;
  domain: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  status: 'active' | 'archived';
  cycle: 'monthly' | 'yearly';
}
