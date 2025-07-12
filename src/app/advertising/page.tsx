import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvertisingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Advertising</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Information about advertising opportunities.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}