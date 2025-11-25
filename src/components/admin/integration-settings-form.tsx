"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc, setDoc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, AlertTriangle, CheckCircle, Copy, Info, RefreshCw, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { v4 as uuidv4 } from 'uuid';


interface IntegrationSettingsFormProps {
    integration: {
        slug: string;
        title: string;
        description: string;
        fields?: string[];
    }
}

export function IntegrationSettingsForm({ integration }: IntegrationSettingsFormProps) {
    const [settings, setSettings] = useState<any>({
        headerName: 'x-inbound-secret' // Default value
    });
    const [isSaving, setIsSaving] = useState(false);
    
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "admin_settings", integration.slug);
    }, [firestore, integration.slug]);

    const { data: existingSettings, isLoading: isLoadingSettings } = useDoc(settingsRef);

    // This is now a fixed relative path for the API route.
    const webhookPath = "/api/inbound-webhook";

    useEffect(() => {
        if (existingSettings) {
            setSettings({
                headerName: 'x-inbound-secret', // Default value
                ...existingSettings
            });
        } else if (!isLoadingSettings && integration.slug === 'inbound-new' && !settings.secret) {
            handleGenerateSecret();
        }
    }, [existingSettings, isLoadingSettings, integration.slug]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setSettings(prev => ({...prev, [id]: value}));
    }

    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: `${subject} copied to clipboard.` });
    };

    const handleGenerateSecret = (regenerate = false) => {
        const newSecret = uuidv4();
        setSettings(prev => ({ ...prev, secret: newSecret, enabled: true }));
        if (regenerate) {
             toast({ title: 'New Secret Generated', description: 'Click "Save Changes" to apply it.' });
        }
    }


    const handleSaveChanges = async () => {
        if (!settingsRef) return;
        
        setIsSaving(true);
        
        try {
            const enabled = (integration.slug === 'inbound-new' && !!settings.secret && !!settings.headerName);
            const settingsToSave = { ...settings, enabled };

            await setDoc(settingsRef, settingsToSave, { merge: true });

            toast({
                title: "Settings Saved",
                description: `${integration.title} configuration has been successfully saved.`,
            });
            
            setTimeout(() => router.push('/admin/settings/integrations'), 1500);

        } catch (error: any) {
            console.error("Error saving settings:", error);
             toast({
                title: "Save Failed",
                description: error.message || "Could not save settings to the database.",
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
        if (isLoadingSettings) {
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
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Important: Mailgun Setup</AlertTitle>
                            <AlertDescription>
                                This integration is currently not available. Please use inbound.new.
                            </AlertDescription>
                        </Alert>
                    </div>
                );
            case "inbound-new":
                 return (
                    <div className="space-y-6">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription>
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                    <li>
                                        <strong>Webhook URL Path:</strong> Your webhook is located at the path below. To make it work, you must combine it with your app's public domain.
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input readOnly value={webhookPath} className="bg-muted font-mono" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(webhookPath, 'Webhook Path')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs mt-1">Example Production URL: `https://www.your-app.com/api/inbound-webhook`</p>
                                    </li>
                                     <li>
                                        <strong>Testing:</strong> To test this in the development environment, a special temporary public URL will be provided. Use this full URL in your webhook provider's dashboard.
                                        <Button variant="link" size="sm" className="h-auto p-0 ml-1" onClick={() => window.open('https://g.co/studio/features/port-forwarding', '_blank')}>
                                            Learn More <ExternalLink className="ml-1 h-3 w-3" />
                                        </Button>
                                    </li>
                                    <li>In your provider's dashboard, paste the full public URL into the "Webhook URL" or "Endpoint" field.</li>
                                    <li>Copy and paste the <strong>Header Name</strong> and <strong>Your Webhook Secret</strong> below into your provider's "Custom Headers" section to secure your endpoint.</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="headerName">Header Name</Label>
                                <Input id="headerName" placeholder="e.g., x-inbound-secret" value={settings.headerName || ''} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="secret">Your Webhook Secret</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="secret" readOnly type="password" placeholder="Generating secret key..." value={settings.secret || ''} className="bg-muted" />
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(settings.secret, 'Webhook Secret')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                     <Button type="button" variant="outline" size="icon" onClick={() => handleGenerateSecret(true)}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
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

    const isSaveDisabled = () => {
        if (isSaving || isLoadingSettings) return true;
        if (integration.slug === 'inbound-new' && (!settings.secret || !settings.headerName)) return true;
        return false;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{integration.title} Settings</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {renderFormFields()}

            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaveDisabled()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
