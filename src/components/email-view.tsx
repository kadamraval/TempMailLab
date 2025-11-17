

"use client";

import type { Email } from "@/types";
import { Button } from "./ui/button";
import { ArrowLeft, Paperclip, Download, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import type { Plan } from "@/app/(admin)/admin/packages/data";

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
  
  const allowAttachments = plan?.features.allowAttachments ?? false;
  const showSourceCode = plan?.features.sourceCodeView ?? false;

  return (
    <Card className="h-full flex flex-col border-0 shadow-none rounded-none">
      <CardHeader className="flex flex-row items-center gap-4">
         {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-grow">
            <CardTitle className="text-lg font-semibold">{email.subject}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">
              From: {email.senderName}
            </CardDescription>
        </div>
        <div className="text-xs text-muted-foreground text-right shrink-0">
            {new Date(email.receivedAt).toLocaleDateString()}
            <br />
            {new Date(email.receivedAt).toLocaleTimeString()}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
        <Tabs defaultValue={email.htmlContent ? "html" : "text"} className="w-full flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="html" disabled={!email.htmlContent}>Preview</TabsTrigger>
            <TabsTrigger value="text" disabled={!email.textContent}>Text</TabsTrigger>
            {showSourceCode && <TabsTrigger value="source">Source</TabsTrigger>}
          </TabsList>
          <TabsContent value="html" className="flex-1 mt-4 rounded-md border overflow-hidden">
             {email.htmlContent ? (
                 <iframe
                    srcDoc={email.htmlContent}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-same-origin"
                 />
            ) : <p className="p-4 text-muted-foreground">No HTML view available.</p>}
          </TabsContent>
          <TabsContent value="text" className="flex-1 mt-4 rounded-md border p-4 bg-muted/30">
            <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto h-full">
              {email.textContent || 'No plain text view available.'}
            </pre>
          </TabsContent>
          {showSourceCode && (
            <TabsContent value="source" className="flex-1 mt-4 rounded-md border p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto h-full">
                    {email.rawContent || "No raw source available."}
                </pre>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      {allowAttachments && email.attachments && email.attachments.length > 0 && (
         <CardFooter className="p-4 border-t">
            <div className="w-full">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                </h4>
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
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
