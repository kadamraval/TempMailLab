
"use client";

import type { Email } from "@/types";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";

interface EmailViewProps {
  email: Email;
  onBack: () => void;
  showBackButton?: boolean;
}

export function EmailView({ email, onBack, showBackButton = true }: EmailViewProps) {
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
        </Tabs>
      </CardContent>
    </Card>
  );
}

