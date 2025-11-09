
import type { Email } from "@/types";
import { cn } from "@/lib/utils";
import { Inbox, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

const EnvelopeLoader = () => (
    <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Envelope Back */}
            <path d="M10 25 L40 50 L70 25 L70 60 H10 V25Z" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/50"/>
            {/* Message paper */}
            <rect x="18" y="30" width="44" height="0" fill="hsl(var(--primary))" className="animate-[expand_1.5s_ease-out_infinite]" style={{ animationDelay: '0.2s' }}/>
            {/* Envelope Front */}
            <path d="M10 25 L40 50 L70 25" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M10 60 L40 35 L70 60" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <style jsx>{`
            @keyframes expand {
                0% { height: 0; y: 30; opacity: 0; }
                40% { height: 20px; y: 10px; opacity: 1; }
                80% { height: 20px; y: 10px; opacity: 1; }
                100% { height: 0; y: 30; opacity: 0; }
            }
        `}</style>
    </div>
);


interface InboxViewProps {
  inbox: Email[];
  onSelectEmail: (email: Email) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function InboxView({ inbox, onSelectEmail, onRefresh, isRefreshing }: InboxViewProps) {
  if (inbox.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center space-y-4 min-h-[300px]">
        <EnvelopeLoader />
        <p className="mt-4 text-lg">Waiting for incoming emails...</p>
        <Button onClick={onRefresh} variant="secondary" disabled={isRefreshing}>
            {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isRefreshing ? 'Checking...' : 'Refresh'}
        </Button>
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
