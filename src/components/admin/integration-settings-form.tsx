"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc, setDoc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


interface IntegrationSettingsFormProps {
    integration: {
        slug: string;
        title: string;
        description: string;
        fields?: string[];
    }
}

export function IntegrationSettingsForm({ integration }: IntegrationSettingsFormProps) {
    const [settings, setSettings] = useState({
        enabled: false,
        signingKey: "", 
        apiKey: "",
        domain: "",
        region: "US" as "US" | "EU",
    });
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore || integration.slug !== 'mailgun') return null;
        return doc(firestore, "admin_settings", integration.slug);
    }, [firestore, integration.slug])

    const { data: existingSettings, isLoading: isLoadingSettings } = useDoc(settingsRef);

    useEffect(() => {
        if (existingSettings) {
            setSettings({
                enabled: existingSettings.enabled ?? false,
                signingKey: existingSettings.signingKey ?? "",
                apiKey: existingSettings.apiKey ?? "",
                domain: existingSettings.domain ?? "",
                region: existingSettings.region ?? "US",
            })
        }
    }, [existingSettings]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleRegionChange = (value: "US" | "EU") => {
        setSettings(prev => ({ ...prev, region: value }));
    };

    const handleSaveChanges = async () => {
        if (integration.slug !== 'mailgun' || !settingsRef) return;
        
        setIsSaving(true);
        
        try {
            const settingsToSave = {
                signingKey: settings.signingKey,
                apiKey: settings.apiKey,
                domain: settings.domain,
                region: settings.region,
                enabled: !!(settings.signingKey && settings.apiKey && settings.domain)
            };

            await setDoc(settingsRef, settingsToSave, { merge: true });

            toast({
                title: "Settings Saved",
                description: `${integration.title} configuration has been updated.`,
            });
            router.push('/admin/settings/integrations');

        } catch (error: any) {
            console.error("Error saving settings:", error);
            toast({
                title: "Error Saving Settings",
                description: error.message || "An unknown error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin/settings/integrations');
    };

    const renderFormFields = () => {
        if (isLoadingSettings && integration.slug === 'mailgun') {
            return (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )
        }

        switch (integration.slug) {
            case "mailgun":
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Private API Key</Label>
                            <Input id="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.apiKey} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Your secret API key. Found under Settings &gt; API Keys in Mailgun.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Mailgun Domain</Label>
                            <Input id="domain" placeholder="mg.yourdomain.com" value={settings.domain} onChange={handleInputChange} />
                             <p className="text-sm text-muted-foreground">The domain you have configured in Mailgun for receiving emails.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signingKey">HTTP Webhook Signing Key (Optional)</Label>
                            <Input id="signingKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.signingKey} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Used to verify webhooks. Found under Sending &gt; Webhooks.
                            </p>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="region">Mailgun Region</Label>
                             <Select value={settings.region} onValueChange={handleRegionChange}>
                                <SelectTrigger id="region">
                                    <SelectValue placeholder="Select your Mailgun account region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="US">US (api.mailgun.net)</SelectItem>
                                    <SelectItem value="EU">EU (api.eu.mailgun.net)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Select the region where your Mailgun account is hosted.
                            </p>
                        </div>
                    </div>
                );
            
            default:
                return (
                     <p className="text-sm text-muted-foreground">
                        This integration is not yet configurable.
                    </p>
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

                 {integration.slug === 'mailgun' && (
                    <>
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-integration" className="text-base">Enable Integration</Label>
                            <p className="text-sm text-muted-foreground">
                                This is enabled automatically once you provide an API Key and Domain.
                            </p>
                        </div>
                        <Switch 
                            id="enable-integration"
                            checked={settings.enabled}
                            disabled={true}
                        />
                    </div>
                    </>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={integration.slug !== 'mailgun' || isSaving || isLoadingSettings}>
                        {(isSaving || isLoadingSettings) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
