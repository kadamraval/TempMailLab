import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function IntegrationsSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Manage your integrations and application settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Firebase Integration</h3>
            <p className="text-sm text-muted-foreground">
                Enter your Firebase service account credentials to enable user management features. 
                These are stored securely and are required for authentication and database operations.
            </p>
            <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input id="projectId" placeholder="your-firebase-project-id" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input id="clientEmail" placeholder="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Textarea id="privateKey" placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" className="min-h-32 font-mono"/>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Settings</Button>
      </CardFooter>
    </Card>
  );
}
