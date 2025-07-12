export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  htmlBody?: string;
  time: string;
  read: boolean;
}
