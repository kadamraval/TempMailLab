import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StayConnected } from "@/components/stay-connected";

export default function ApiPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>TempInbox API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Integrate the power of temporary email generation directly into your applications with the TempInbox API. Our powerful, easy-to-use API is perfect for developers who need to automate testing, user sign-ups, and more.</p>
            
            <h3 className="text-xl font-semibold pt-4">API Features</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Generate new temporary email addresses on the fly.</li>
                <li>Fetch incoming emails for a specific address.</li>
                <li>Check inbox status and manage messages.</li>
                <li>RESTful endpoints with predictable JSON responses.</li>
            </ul>

            <h3 className="text-xl font-semibold pt-4">Getting Started</h3>
            <p>Access to our API is available under our Premium plans. To get your API key and start building, please check out our subscription options.</p>
            <pre className="bg-muted p-4 rounded-md text-sm font-mono mt-2">
                <code>
                    {`// Example: Generate a new email
fetch('https://api.tempinbox.com/v1/new-address')
  .then(res => res.json())
  .then(data => console.log(data.email));`}
                </code>
            </pre>
            <p className="text-sm text-muted-foreground pt-2">Full API documentation will be provided upon subscribing to a premium plan.</p>
          </CardContent>
        </Card>
      </main>
      <StayConnected />
      <Footer />
    </div>
  );
}
