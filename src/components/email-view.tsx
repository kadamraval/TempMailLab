
"use client";

import type { Email } from "@/types";
import { Button } from "./ui/button";
import { ArrowLeft, Paperclip, Download, Code, Archive, Trash2, Forward, Star, Ban, ShieldAlert, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import type { Plan } from "@/app/(admin)/admin/packages/data";
import { Timestamp } from "firebase/firestore";
import { ScrollArea } from "./ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface EmailViewProps {
  email: Email;
  plan: Plan | null;
  onBack: () => void;
  showBackButton?: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function EmailView({ email, plan, onBack, showBackButton = true }: EmailViewProps) {
  const { toast } = useToast();

  const handlePremiumClick = () => {
    toast({
        title: "Premium Feature",
        description: "This feature is available on our Premium plan. Please upgrade to use it.",
        variant: "destructive"
    });
  }

  const allowAttachments = plan?.features.allowAttachments ?? false;
  const showSourceCode = plan?.features.sourceCodeView ?? false;
  
  const receivedAtDate = email.receivedAt instanceof Timestamp 
    ? email.receivedAt.toDate() 
    : new Date(email.receivedAt);


  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b">
         {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-grow truncate">
            <h3 className="text-sm font-semibold leading-none truncate">{email.subject}</h3>
            <p className="text-xs text-muted-foreground pt-1 truncate">
              From: {email.senderName}
            </p>
        </div>
         <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground text-right shrink-0 hidden sm:inline-block">
                {receivedAtDate.toLocaleDateString()} {receivedAtDate.toLocaleTimeString()}
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={!plan?.features.allowArchiving} onClick={!plan?.features.allowArchiving ? handlePremiumClick : undefined}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                    <DropdownMenuItem disabled={!plan?.features.allowStarring} onClick={!plan?.features.allowStarring ? handlePremiumClick : undefined}><Star className="mr-2 h-4 w-4" /> Star</DropdownMenuItem>
                    <DropdownMenuItem disabled={!plan?.features.emailForwarding} onClick={!plan?.features.emailForwarding ? handlePremiumClick : undefined}><Forward className="mr-2 h-4 w-4" /> Forward</DropdownMenuItem>
                    <DropdownMenuItem disabled={!plan?.features.block} onClick={!plan?.features.block ? handlePremiumClick : undefined}><Ban className="mr-2 h-4 w-4" /> Block Sender</DropdownMenuItem>
                    <DropdownMenuItem disabled={!plan?.features.spam} onClick={!plan?.features.spam ? handlePremiumClick : undefined}><ShieldAlert className="mr-2 h-4 w-4" /> Report Spam</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
             {email.htmlContent ? (
                 <iframe
                    srcDoc={email.htmlContent}
                    className="w-full h-full border-0 bg-white min-h-[calc(100vh-500px)]"
                    sandbox="allow-same-origin"
                 />
            ) : <pre className="whitespace-pre-wrap font-mono text-sm">{email.textContent || 'No content to display.'}</pre>}
        </div>
      </ScrollArea>
      
      {email.attachments && email.attachments.length > 0 && (
         <div className="p-4 border-t">
            <div className="w-full">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                </h4>
                {allowAttachments ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {email.attachments.map((att, index) => (
                            <a 
                                key={index}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-2 rounded-md border bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                                <Download className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-grow truncate">
                                    <p className="text-sm font-medium truncate">{att.filename}</p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(att.size)}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">Viewing attachments is a premium feature.</p>
                        <Button size="sm" className="mt-2" onClick={handlePremiumClick}>Upgrade to View</Button>
                    </div>
                )}
            </div>
        </div>
      )}
       {showSourceCode && email.rawContent && (
        <div className="p-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Raw Email Source</h4>
          <ScrollArea className="h-48 bg-muted rounded-md p-2">
            <pre className="text-xs font-mono">{email.rawContent}</pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
