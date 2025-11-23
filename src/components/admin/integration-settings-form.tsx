
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

    const webhookPath = "/api/inbound-webhook";

    useEffect(() => {
        if (existingSettings) {
            setSettings(existingSettings);
        } else if (!isLoadingSettings && integration.slug === 'inbound-new' && !settings.secret) {
            // Pre-populate with secure defaults if no settings exist
            setSettings(prev => ({ 
                ...prev, 
                secret: uuidv4(), 
                headerName: 'x-inbound-secret' 
            }));
        }
    }, [existingSettings, isLoadingSettings, integration.slug, settings.secret]);


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
        if (!text) {
             toast({ title: 'Nothing to copy', description: `Generate a ${subject.toLowerCase()} first.`, variant: 'destructive'});
             return;
        }
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: `${subject} copied to clipboard.` });
    };

    const handleGenerateSecret = () => {
        const newSecret = uuidv4();
        setSettings(prev => ({ ...prev, secret: newSecret }));
        toast({ title: 'New Secret Generated', description: 'Click "Save Changes" to apply it.' });
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
            // Determine if the integration is enabled based on its required fields
            const enabled = (integration.slug === 'mailgun' && !!settings.apiKey && !!settings.domain) || 
                            (integration.slug === 'inbound-new' && !!settings.secret && !!settings.headerName);
            
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
                                    <li>In your Mailgun dashboard, go to **Sending &gt; Domains**, select your domain.</li>
                                    <li>In the domain's settings, enable **Store and Notify** for message storage.</li>
                                    <li>Go to **Receiving &gt; Routes** and create a new route.</li>
                                    <li>For "Expression Type", select **Match Recipient**. In "Recipient", enter `*@your-mailgun-domain.com`.</li>
                                    <li>For "Actions", check **Forward** and enter `https://[YOUR_PUBLIC_DOMAIN]${webhookPath}`. You will get your public domain after deploying the app.</li>
                                    <li>Use the settings below to secure the connection. Your **Private API Key** from Mailgun will act as the webhook secret.</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Private API Key (Webhook Secret)</Label>
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
                            <AlertTitle>How This Works: Live Deployment</AlertTitle>
                            <AlertDescription>
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                     <li>
                                        <strong>Deploy Your App:</strong> First, deploy your application using Firebase App Hosting to get a public URL (e.g., `https://your-app.web.app`).
                                    </li>
                                    <li>
                                        <strong>Configure Webhook:</strong> In your `inbound.new` dashboard, go to the webhooks section and create a new webhook.
                                    </li>
                                    <li>
                                        <strong>Webhook URL:</strong> Combine your public URL with the webhook path below. For example: `https://your-app.web.app/api/inbound-webhook`.
                                    </li>
                                    <li>
                                        <strong>Secure It:</strong> Copy the **Header Name** and **Webhook Secret** from this page into the corresponding fields in your `inbound.new` webhook configuration. This keeps your endpoint secure.
                                    </li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-4 pt-4">
                            <h3 className="text-md font-semibold">Production Webhook Settings</h3>
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
                                    <Label htmlFor="headerName">Webhook Header Name</Label>
                                    <Input id="headerName" placeholder="e.g., x-inbound-secret" value={settings.headerName || 'x-inbound-secret'} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secret">Webhook Secret</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="secret" readOnly type="password" placeholder="Generate a secret..." value={settings.secret || ''} className="bg-muted" />
                                        <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(settings.secret, 'Webhook Secret')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="outline" size="icon" onClick={handleGenerateSecret}>
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
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
