import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CloudConsoleSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Console</CardTitle>
        <CardDescription>Access your cloud provider's console.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Direct links to your project's cloud console (e.g., Firebase, Google Cloud, AWS) can be placed here.</p>
         <Button asChild className="mt-4">
          <Link href="#" target="_blank">Open Cloud Console</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
