
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function ApiSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>Manage API access and rate limiting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="api-key">Your API Key</Label>
            <div className="flex gap-2">
                <Input id="api-key" value="**********" readOnly />
                <Button variant="secondary">Regenerate Key</Button>
            </div>
            <p className="text-sm text-muted-foreground">This key is used to authenticate requests to the Temp Mailer API.</p>
        </div>
        <Separator />
        <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
            <Input id="rate-limit" type="number" defaultValue="100" />
            <p className="text-sm text-muted-foreground">Set the number of requests allowed per minute for a single API key.</p>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
