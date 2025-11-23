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
    const [settings, setSettings] = useState<any>({
        headerName: 'x-inbound-secret' // Default value
    });
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
            setSettings({
                headerName: 'x-inbound-secret', // Default value
                ...existingSettings
            });
        } else if (!isLoadingSettings && integration.slug === 'inbound-new' && !settings.apiKey) {
            handleGenerateSecret();
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

    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: `${subject} copied to clipboard.` });
    };

    const handleGenerateSecret = (regenerate = false) => {
        const newSecret = uuidv4();
        setSettings(prev => ({ ...prev, apiKey: newSecret, enabled: true }));
        if (regenerate) {
             toast({ title: 'New Secret Generated', description: 'Click "Save Changes" to apply it.' });
        }
    }


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
                                    <li>In your Mailgun dashboard, select the desired domain.</li>
                                    <li>Go to the "Routes" tab and create a new route.</li>
                                    <li>For the "Expression Type", select "Match Recipient".</li>
                                    <li>In the "Recipient" field, enter `*@your-domain.com` (replace with your actual Mailgun domain).</li>
                                    <li>In the "Actions" section, check "Forward" and enter your public webhook URL: `https://[YOUR_PUBLIC_DOMAIN]${webhookPath}`. You must replace `[YOUR_PUBLIC_DOMAIN]` with your app's live domain name.</li>
                                    <li>Also check "Store and Notify".</li>
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
                                        <strong>For Development/Testing:</strong> To test email receiving, go to your `inbound.new` dashboard, get your **API Key**, and paste it below. Then use the **Refresh** button on the main inbox page to check for mail. You do not need to configure a webhook for local testing.
                                    </li>
                                    <li>
                                        <strong>For Production (Live App):</strong> To receive emails automatically, configure a webhook in `inbound.new`. Use the URL path below combined with your public domain (e.g., `https://yourapp.com/api/inbound-webhook`). Secure it by adding a custom header with the **Header Name** and **Webhook Secret** from this page.
                                    </li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                         <div className="space-y-2">
                            <Label htmlFor="apiKey">inbound.new API Key (for testing)</Label>
                            <Input id="apiKey" type="password" placeholder="Paste your API key here" value={settings.apiKey || ''} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Used for the manual "Refresh" button in development. Found in your `inbound.new` dashboard under **Settings &gt; API Keys**.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="webhookPath">Production Webhook Path</Label>
                             <div className="flex items-center gap-2">
                                <Input readOnly value={webhookPath} className="bg-muted font-mono" />
                                <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(webhookPath, 'Webhook Path')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="headerName">Production Webhook Header</Label>
                                <Input id="headerName" placeholder="e.g., x-inbound-secret" value={settings.headerName || ''} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="secret">Production Webhook Secret</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="secret" readOnly type="password" placeholder="Generate a secret..." value={settings.secret || ''} className="bg-muted" />
                                    <Button type="button" variant="outline" size="icon" onClick={() => settings.secret && handleCopy(settings.secret, 'Webhook Secret')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                     <Button type="button" variant="outline" size="icon" onClick={() => setSettings(prev => ({...prev, secret: uuidv4()}))}>
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
        if (integration.slug === 'mailgun' && (!settings.apiKey || !settings.domain)) return true;
        // For inbound.new, apiKey is now required for dev, and header/secret for prod. We can just check for apiKey for simplicity of the save button
        if (integration.slug === 'inbound-new' && !settings.apiKey) return true;
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
