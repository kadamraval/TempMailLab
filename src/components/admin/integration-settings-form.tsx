
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
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2 } from "lucide-react";
import { saveMailgunSettingsAction } from "@/lib/actions/settings";


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
        apiKey: "",
        domain: "",
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
                apiKey: existingSettings.apiKey ?? "",
                domain: existingSettings.domain ?? "",
            })
        }
    }, [existingSettings]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, enabled: checked }));
    };

    const handleSaveChanges = async () => {
        if (integration.slug !== 'mailgun') return;
        
        setIsSaving(true);
        
        try {
            const settingsToSave = {
                apiKey: settings.apiKey,
                domain: settings.domain,
            };
            const result = await saveMailgunSettingsAction(settingsToSave);
            
            if (result.error) {
                 throw new Error(result.error);
            }

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
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Mailgun Signing Key</Label>
                            <Input id="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.apiKey} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Your <span className="font-semibold">HTTP webhook signing key</span>. You can find this in your Mailgun account under Sending &gt; Webhooks.
                            </p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="domain">Mailgun Domain</Label>
                            <Input id="domain" placeholder="mg.yourdomain.com" value={settings.domain} onChange={handleInputChange} />
                             <p className="text-sm text-muted-foreground">The domain you have configured in Mailgun for receiving emails.</p>
                        </div>
                    </>
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
                                This will be enabled automatically once you provide a valid Signing Key and Domain.
                            </p>
                        </div>
                        <Switch 
                            id="enable-integration"
                            checked={settings.enabled}
                            onCheckedChange={handleSwitchChange}
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
