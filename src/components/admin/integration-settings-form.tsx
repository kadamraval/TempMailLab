
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, AlertTriangle, CheckCircle, Copy, Info, RefreshCw, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { verifyMailgunSettingsAction } from "@/lib/actions/settings";
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
    const [settings, setSettings] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [verificationMessage, setVerificationMessage] = useState('');
    
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
             setSettings(existingSettings);
        } else if (!isLoadingSettings && integration.slug === 'inbound-new' && !settings.apiKey) {
            // If there are no existing settings for inbound.new, pre-populate the form.
            setSettings({
                headerName: 'x-inbound-secret',
                apiKey: uuidv4(),
                enabled: false,
            });
        }
    }, [existingSettings, isLoadingSettings, integration.slug]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
        setVerificationStatus('idle');
    };

    const handleSelectChange = (id: string, value: string) => {
        setSettings(prev => ({...prev, [id]: value}));
        setVerificationStatus('idle');
    }

    const handleCopy = (text: string | undefined, subject: string) => {
        if (!text) {
             toast({ title: 'Nothing to Copy', description: `Cannot copy an empty ${subject}.`, variant: "destructive" });
             return;
        }
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: `${subject} copied to clipboard.` });
    };

    const handleSaveChanges = async () => {
        if (!settingsRef) return;
        
        setIsSaving(true);
        setVerificationStatus('idle');
        
        if (integration.slug === 'mailgun') {
            setVerificationMessage('Verifying credentials...');
            try {
                const verificationResult = await verifyMailgunSettingsAction({
                    apiKey: settings.apiKey,
                    domain: settings.domain,
                    region: settings.region || 'US',
                });

                setVerificationMessage(verificationResult.message);

                if (!verificationResult.success) {
                    setVerificationStatus('error');
                    toast({ title: "Verification Failed", description: verificationResult.message, variant: "destructive" });
                    setIsSaving(false);
                    return; 
                }

                setVerificationStatus('success');

            } catch (error: any) {
                setVerificationStatus('error');
                setVerificationMessage(error.message || "An unexpected client-side error occurred.");
                setIsSaving(false);
                return;
            }
        }
        
        try {
            const enabled = (integration.slug === 'mailgun' && !!settings.apiKey && !!settings.domain) || 
                            (integration.slug === 'inbound-new' && !!settings.apiKey && !!settings.headerName);
            
            const settingsToSave = { ...settings, enabled };

            // Explicitly remove the old 'secret' field if it exists
            if (settingsToSave.secret) {
                delete settingsToSave.secret;
                await updateDoc(settingsRef, {
                    secret: deleteField()
                });
            }

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
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                    <li>In your Mailgun dashboard, go to **Receiving** &gt; **Routes** and create a new route.</li>
                                    <li>For the "Expression Type", select **"Match Recipient"**.</li>
                                    <li>In the "Recipient" field, enter `*@your-domain.com` (replace with your actual Mailgun domain).</li>
                                    <li>In the "Actions" section, check **"Forward"** and enter your full public webhook URL: `https://your-app-domain.com${webhookPath}`.</li>
                                    <li>Set the priority to **0**. Click **"Create Route"**.</li>
                                    <li>Under your domain's settings, go to **Webhook Signing** and copy your **"signing-key"**. You will need to add this to your environment variables.</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Private API Key</Label>
                            <Input id="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={settings.apiKey || ''} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Your secret API key. Found under Settings &gt; API Keys in Mailgun.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Mailgun Domain</Label>
                            <Input id="domain" placeholder="mg.yourdomain.com" value={settings.domain || ''} onChange={handleInputChange} />
                             <p className="text-sm text-muted-foreground">The domain you have configured in Mailgun for receiving emails.</p>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="region">Mailgun Region</Label>
                             <Select value={settings.region || 'US'} onValueChange={(value) => handleSelectChange('region', value)}>
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
            case "inbound-new":
                 return (
                    <div className="space-y-6">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription>
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                    <li>
                                        <strong>Webhook URL:</strong> Provide this full URL to `inbound.new`. Combine your public domain with the path below (e.g., `https://tempmailoz.com/api/inbound-webhook`).
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input readOnly value={webhookPath} className="bg-muted font-mono" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(webhookPath, 'Webhook Path')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </li>
                                    <li>
                                        <strong>Custom Headers:</strong> In your `inbound.new` dashboard, go to the "Custom Headers" section for your webhook.
                                    </li>
                                    <li>Copy the **Header name** and **Header value** from the fields below and paste them into the corresponding inputs in the `inbound.new` dashboard.</li>
                                    <li>Click **Save Changes** below to activate this configuration.</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label>Custom Header</Label>
                            <div className="flex items-center gap-2 p-4 border rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="headerName" className="text-xs text-muted-foreground">Header name</Label>
                                        <Input id="headerName" placeholder="e.g., x-inbound-secret" value={settings.headerName || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="apiKey" className="text-xs text-muted-foreground">Header value</Label>
                                        <div className="flex items-center gap-2">
                                            <Input id="apiKey" readOnly type="text" placeholder="Auto-generated on save" value={settings.apiKey || ''} className="bg-muted" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(settings.apiKey, 'Header value')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">This name/value pair is used to secure your webhook endpoint.</p>
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
        if (integration.slug === 'mailgun' && (!settings.apiKey || !settings.domain)) return true;
        if (integration.slug === 'inbound-new' && (!settings.apiKey || !settings.headerName)) return true;
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

                {verificationStatus !== 'idle' && verificationMessage && integration.slug === 'mailgun' && (
                    <Alert variant={verificationStatus === 'error' ? 'destructive' : 'default'} className={verificationStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}>
                         {verificationStatus === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{verificationStatus === 'success' ? 'Verification Successful' : 'Verification Status'}</AlertTitle>
                        <AlertDescription>
                            {verificationMessage}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaveDisabled()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {integration.slug === 'mailgun' ? 'Verify & Save' : 'Save Changes'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

    