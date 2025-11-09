

export interface Email {
  id: string; 
  recipient?: string;
  senderName: string;
  subject: string;
  receivedAt: string;
  htmlContent?: string;
  textContent?: string;
  read?: boolean;
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

// This is now defined in src/app/(admin)/admin/packages/data.ts
// export interface Plan {
//   id: string;
//   name: string;
//   price: number;
//   features: string;
//   status: 'active' | 'archived';
//   cycle: 'monthly' | 'yearly';
// }
