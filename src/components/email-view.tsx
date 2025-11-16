
"use client";

import type { Email } from "@/types";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";

interface EmailViewProps {
  email: Email;
  onBack: () => void;
  showBackButton?: boolean;
}

export function EmailView({ email, onBack, showBackButton = true }: EmailViewProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex-grow truncate pr-4">{email.subject}</CardTitle>
            {showBackButton && (
              <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
              </Button>
            )}
        </div>
        <div className="text-sm text-muted-foreground pt-2">
          <p><strong>From:</strong> {email.senderName}</p>
          <p><strong>Time:</strong> {new Date(email.receivedAt).toLocaleString()}</p>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 flex-1 flex flex-col">
        <Tabs defaultValue={email.htmlContent ? "html" : "text"} className="w-full flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="html" disabled={!email.htmlContent}>HTML</TabsTrigger>
            <TabsTrigger value="text" disabled={!email.textContent}>Plain Text</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="flex-1 mt-4">
            <div className="border rounded-md h-full bg-white text-black">
                {email.htmlContent ? (
                     <iframe
                        srcDoc={email.htmlContent}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin"
                     />
                ) : <p className="p-4">No HTML view available.</p>}
            </div>
          </TabsContent>
          <TabsContent value="text" className="flex-1 mt-4">
            <div className="p-4 border rounded-md h-full bg-muted/30 whitespace-pre-wrap font-mono text-sm overflow-auto">
              {email.textContent || 'No plain text view available.'}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
