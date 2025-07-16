
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function CloudConsoleSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Console Links</CardTitle>
        <CardDescription>Quick links to your project on Google Cloud and Firebase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild variant="outline" className="w-full justify-start">
            <Link href="https://console.firebase.google.com/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Firebase Console
            </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
            <Link href="https://console.cloud.google.com/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Cloud Console
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
