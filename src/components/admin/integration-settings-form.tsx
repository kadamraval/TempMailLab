
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
import { Textarea } from "../ui/textarea";
import { useFirestore } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

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
    const [settings, setSettings] = useState({
        enabled: integration.isConfigured,
        apiKey: "",
        domain: "",
        cloudFunctionName: "",
    });
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const settingsRef = doc(firestore, "admin_settings", "mailgun");

    useEffect(() => {
        const fetchSettings = async () => {
            if (integration.slug !== 'mailgun') {
                setIsLoading(false);
                return;
            };

            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings({
                    enabled: data.enabled ?? true,
                    apiKey: data.apiKey ?? "",
                    domain: data.domain ?? "",
                    cloudFunctionName: data.cloudFunctionName ?? "",
                });
            }
            setIsLoading(false);
        };

        fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, integration.slug]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, enabled: checked }));
    };

    const handleSaveChanges = async () => {
        if (integration.slug !== 'mailgun') return;
        
        try {
            await setDoc(settingsRef, settings, { merge: true });
            toast({
                title: "Settings Saved",
                description: `Configuration for ${integration.title} has been updated.`,
            });
        } catch (error) {
             toast({
                title: "Error",
                description: `Could not save settings.`,
                variant: "destructive",
            });
        }
    };

    const handleCancel = () => {
        router.push('/admin/settings/integrations');
    };

    const renderFormFields = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )
        }
        
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
            
            // Cases for other integrations can be added here
            
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
                                Turn this integration on or off for your application.
                            </p>
                        </div>
                        <Switch 
                            id="enable-integration"
                            checked={settings.enabled}
                            onCheckedChange={handleSwitchChange}
                        />
                    </div>
                    </>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={integration.slug !== 'mailgun' || isLoading}>Save Changes</Button>
                </div>
            </CardFooter>
        </Card>
    )
}
