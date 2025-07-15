
"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface IntegrationSettingsFormProps {
    integration: {
        slug: string;
        title: string;
        description: string;
        isConfigured: boolean;
    }
}

export function IntegrationSettingsForm({ integration }: IntegrationSettingsFormProps) {
    const [apiKey, setApiKey] = useState("");
    const [isEnabled, setIsEnabled] = useState(integration.isConfigured);
    const { toast } = useToast();
    const router = useRouter();

    const handleSaveChanges = () => {
        // In a real application, you would save these settings to your backend/database.
        console.log(`Saving settings for ${integration.title}:`, { apiKey, isEnabled });
        toast({
            title: "Settings Saved",
            description: `Configuration for ${integration.title} has been updated.`,
        });
    };

    const handleCancel = () => {
        router.push('/admin/settings/integrations');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{integration.title} Settings</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input 
                        id="api-key" 
                        placeholder="Enter your API key" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                        Enter the API key provided by the service.
                    </p>
                </div>
                <Separator />
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-integration" className="text-base">Enable Integration</Label>
                        <p className="text-sm text-muted-foreground">
                            Turn this integration on or off for your application.
                        </p>
                    </div>
                    <Switch 
                        id="enable-integration"
                        checked={isEnabled}
                        onCheckedChange={setIsEnabled}
                    />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
            </CardFooter>
        </Card>
    )
}
