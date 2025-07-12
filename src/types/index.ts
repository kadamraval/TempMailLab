export interface Email {
  id: number;
  from: string;
  subject: string;
  date: string;
  body?: string;
  htmlBody?: string;
  read?: boolean;
}
