
import type { Email } from "@/types";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface InboxViewProps {
  inbox: Email[];
  onSelectEmail: (email: Email) => void;
}

export function InboxView({ inbox, onSelectEmail }: InboxViewProps) {
  if (inbox.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Inbox className="mx-auto h-12 w-12" />
        <p className="mt-4 text-lg">Your inbox is empty.</p>
        <p>New emails will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {inbox.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelectEmail(email)}
          className={cn(
            "w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-4",
            email.read ? "bg-background hover:bg-muted/50" : "bg-card hover:bg-muted/50 font-semibold"
          )}
        >
          <div className={cn("h-2 w-2 rounded-full shrink-0", !email.read ? 'bg-primary' : 'bg-transparent')}></div>
          <div className="grid grid-cols-5 gap-4 flex-grow items-center">
            <span className="col-span-2 sm:col-span-1 truncate">{email.senderName}</span>
            <span className="col-span-3 sm:col-span-3 truncate">{email.subject}</span>
            <span className="hidden sm:block text-right text-sm text-muted-foreground">{new Date(email.receivedAt).toLocaleString()}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
