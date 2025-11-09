
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
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
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
    });
    const [isLoading, setIsLoading] = useState(true); // Start loading immediately
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const settingsRef = doc(firestore, "admin_settings", "mailgun");

    useEffect(() => {
        if (integration.slug !== 'mailgun') {
            setIsLoading(false);
            return;
        }

        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSettings({
                        enabled: data.enabled ?? false,
                        apiKey: data.apiKey ?? "",
                        domain: data.domain ?? "",
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast({
                    title: "Error",
                    description: "Could not load existing settings.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [firestore, integration.slug, toast]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, enabled: checked }));
    };

    const handleSaveChanges = () => {
        if (integration.slug !== 'mailgun' || isLoading) return;
        
        setIsLoading(true);

        setDoc(settingsRef, settings, { merge: true })
            .then(() => {
                toast({
                    title: "Settings Saved",
                    description: `Configuration for ${integration.title} has been updated.`,
                });
                router.push('/admin/settings/integrations');
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: settings,
                });
                errorEmitter.emit('permission-error', permissionError);
            }).finally(() => {
                setIsLoading(false);
            });
    };

    const handleCancel = () => {
        router.push('/admin/settings/integrations');
    };

    const renderFormFields = () => {
        if (isLoading && integration.slug === 'mailgun') {
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
                            <Label htmlFor="apiKey">Mailgun API Key</Label>
                            <Input id="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.apiKey} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">Your private Mailgun API key.</p>
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

                 {integration.slug === 'mailgun' && !isLoading && (
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
                    <Button onClick={handleSaveChanges} disabled={integration.slug !== 'mailgun' || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
