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
}

export function EmailView({ email, onBack }: EmailViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex-grow truncate pr-4">{email.subject}</CardTitle>
            <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
            </Button>
        </div>
        <div className="text-sm text-muted-foreground pt-2">
          <p><strong>From:</strong> {email.sender}</p>
          <p><strong>Time:</strong> {email.time}</p>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <Tabs defaultValue="html" className="w-full">
          <TabsList>
            <TabsTrigger value="html" disabled={!email.htmlBody}>HTML</TabsTrigger>
            <TabsTrigger value="text">Plain Text</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <div className="mt-4 p-4 border rounded-md min-h-[300px] bg-white text-black">
                {email.htmlBody ? (
                     <iframe
                        srcDoc={email.htmlBody}
                        className="w-full h-[500px] border-0"
                        sandbox="allow-same-origin"
                     />
                ) : <p>No HTML view available.</p>}
            </div>
          </TabsContent>
          <TabsContent value="text">
            <div className="mt-4 p-4 border rounded-md min-h-[300px] bg-muted/30 whitespace-pre-wrap font-mono text-sm">
              {email.body}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
