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
