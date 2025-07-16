
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CacheSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
        <CardDescription>Manage the application's cache to improve performance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h4 className="font-semibold">Clear Application Cache</h4>
                <p className="text-sm text-muted-foreground mt-1">This will clear all cached data, including rendered pages and data fetches. Users may experience a brief slowdown as content is re-cached.</p>
                 <Button variant="destructive" className="mt-4">Clear All Cache</Button>
            </div>
             <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h4 className="font-semibold">Clear User Sessions</h4>
                <p className="text-sm text-muted-foreground mt-1">This will log out all users from all devices. They will need to sign in again.</p>
                 <Button variant="destructive" className="mt-4">Clear All Sessions</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
