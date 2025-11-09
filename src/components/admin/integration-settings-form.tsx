
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
import { Textarea } from "../ui/textarea";

interface IntegrationSettingsFormProps {
    integration: {
        slug: string;
        title: string;
        description: string;
        isConfigured: boolean;
        fields?: string[];
    }
}

export function IntegrationSettingsForm({ integration }: IntegrationSettingsFormProps) {
    // A more robust state to handle various fields
    const [settings, setSettings] = useState({
        enabled: integration.isConfigured,
        apiKey: "",
        apiSecret: "",
        clientId: "",
        clientSecret: "",
        projectId: "",
        measurementId: "",
        containerId: "",
        appId: "",
        privateKey: "",
        serverPrefix: "",
        audienceId: "",
        propertyId: "",
        widgetId: "",
        publisherId: "",
        siteKey: "",
        billingAccountId: "",
        domain: "",
        cloudFunctionName: "",
    });

    const { toast } = useToast();
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, enabled: checked }));
    };

    const handleSaveChanges = () => {
        // Here you would save the settings to Firestore
        console.log(`Saving settings for ${integration.title}:`, settings);
        toast({
            title: "Settings Saved",
            description: `Configuration for ${integration.title} has been updated.`,
        });
    };

    const handleCancel = () => {
        router.push('/admin/settings/integrations');
    };

    const renderFormFields = () => {
        switch (integration.slug) {
            case "mailgun":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Mailgun API Key</Label>
                            <Input id="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.apiKey} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">Your private Mailgun API key.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="domain">Mailgun Domain</Label>
                            <Input id="domain" placeholder="mg.yourdomain.com" value={settings.domain} onChange={handleInputChange} />
                             <p className="text-sm text-muted-foreground">The domain you have configured in Mailgun for receiving emails.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cloudFunctionName">Cloud Function Name</Label>
                            <Input id="cloudFunctionName" placeholder="fetchEmailsFromMailgun" value={settings.cloudFunctionName} onChange={handleInputChange} />
                             <p className="text-sm text-muted-foreground">The name of your callable Google Cloud Function for email processing.</p>
                        </div>
                    </>
                );
            case "firebase":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="projectId">Project ID</Label>
                            <Input id="projectId" placeholder="your-firebase-project-id" value={settings.projectId} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientEmail">Client Email</Label>
                            <Input id="clientEmail" type="email" placeholder="firebase-adminsdk-...@...iam.gserviceaccount.com" value={settings.clientId} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="privateKey">Private Key</Label>
                            <Textarea id="privateKey" placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" value={settings.privateKey} onChange={handleInputChange} className="min-h-32" />
                        </div>
                    </>
                );
            case "mailchimp":
                return (
                     <>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input id="apiKey" placeholder="Enter your MailChimp API key" value={settings.apiKey} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serverPrefix">Server Prefix</Label>
                            <Input id="serverPrefix" placeholder="e.g., us19" value={settings.serverPrefix} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="audienceId">Audience ID</Label>
                            <Input id="audienceId" placeholder="Enter your Audience ID" value={settings.audienceId} onChange={handleInputChange} />
                        </div>
                    </>
                );
            case "google-analytics":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="measurementId">Measurement ID</Label>
                        <Input id="measurementId" placeholder="G-XXXXXXXXXX" value={settings.measurementId} onChange={handleInputChange} />
                    </div>
                );
            case "google-tag-manager":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="containerId">Container ID</Label>
                        <Input id="containerId" placeholder="GTM-XXXXXXX" value={settings.containerId} onChange={handleInputChange} />
                    </div>
                );
            case "paypal":
            case "stripe":
            case "razorpay":
            case "google-login":
            case "facebook-login":
                 return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="clientId">{integration.title.includes('Google') || integration.title.includes('Facebook') ? 'App ID / Client ID' : 'Client ID / Key ID'}</Label>
                            <Input id="clientId" placeholder="Enter your Client ID" value={settings.clientId} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientSecret">{integration.title.includes('Google') || integration.title.includes('Facebook') ? 'App Secret / Client Secret' : 'Client Secret / Key Secret'}</Label>
                            <Input id="clientSecret" type="password" placeholder="Enter your Client Secret" value={settings.clientSecret} onChange={handleInputChange} />
                        </div>
                    </>
                );
            case "tawkto":
                return (
                     <>
                        <div className="space-y-2">
                            <Label htmlFor="propertyId">Property ID</Label>
                            <Input id="propertyId" placeholder="Enter your Tawk.to Property ID" value={settings.propertyId} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="widgetId">Widget ID</Label>
                            <Input id="widgetId" placeholder="e.g., default" value={settings.widgetId} onChange={handleInputChange} />
                        </div>
                    </>
                );
            case "google-adsense":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="publisherId">Publisher ID</Label>
                        <Input id="publisherId" placeholder="pub-XXXXXXXXXXXXXXXX" value={settings.publisherId} onChange={handleInputChange} />
                    </div>
                );
             case "recaptcha":
                 return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="siteKey">Site Key</Label>
                            <Input id="siteKey" placeholder="Enter your reCAPTCHA Site Key" value={settings.siteKey} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiSecret">Secret Key</Label>
                            <Input id="apiSecret" type="password" placeholder="Enter your reCAPTCHA Secret Key" value={settings.apiSecret} onChange={handleInputChange} />
                        </div>
                    </>
                );
            case "mail-tm":
                return (
                    <p className="text-sm text-muted-foreground">
                        This is a core application service and is configured via environment variables. Its status is always 'Connected'.
                    </p>
                )
             case "cloud-billing-api":
             case "cloud-monitoring-api":
                 return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input id="apiKey" placeholder="Enter your Google Cloud API Key" value={settings.apiKey} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="projectId">Project ID</Label>
                            <Input id="projectId" placeholder="Enter your Google Cloud Project ID" value={settings.projectId} onChange={handleInputChange} />
                        </div>
                    </>
                );
            default:
                return (
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input id="apiKey" placeholder="Enter your API key" value={settings.apiKey} onChange={handleInputChange} />
                        <p className="text-sm text-muted-foreground">
                            Enter the primary API key for {integration.title}.
                        </p>
                    </div>
                )
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{integration.title} Settings</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {renderFormFields()}

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
                        checked={settings.enabled}
                        onCheckedChange={handleSwitchChange}
                        disabled={integration.slug === 'mail-tm' || integration.slug === 'firebase'}
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
