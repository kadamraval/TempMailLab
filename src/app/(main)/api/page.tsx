
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Code } from "lucide-react";

export default function ApiPage() {
    return (
        <div className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-16">
                     <div className="inline-block bg-primary/10 p-4 rounded-full">
                        <Code className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                        Developer API
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Integrate Tempmailoz's powerful temporary email functionality directly into your applications with our simple and robust REST API.
                    </p>
                    <div className="pt-4">
                        <Button size="lg">Get API Key</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>API Features</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Generate Inboxes</h3>
                                    <p className="text-muted-foreground">Programmatically create new temporary email addresses on demand.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                                <div>
                                    <h3 className="font-semibold">List Messages</h3>
                                    <p className="text-muted-foreground">Fetch a list of all emails received in a specific inbox.</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-4">
                                <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Read Full Emails</h3>
                                    <p className="text-muted-foreground">Retrieve the complete content of an email, including HTML, text, and headers.</p>
                                </div>
                            </div>
                        </div>
                         <div className="bg-muted/50 rounded-lg p-6 font-mono text-sm overflow-x-auto">
                            <pre><code>
{`// Example: Generate a new inbox
fetch('https://api.tempmailoz.com/v1/inboxes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data.emailAddress);
});

// Example: Fetch emails for an inbox
fetch('https://api.tempmailoz.com/v1/inboxes/INBOX_ID/emails', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(emails => {
  console.log(emails);
});`}
                            </code></pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
