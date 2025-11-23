

"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { verifyMailgunSettingsAction } from "@/lib/actions/settings";


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
    const [webhookUrl, setWebhookUrl] = useState('');


    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "admin_settings", integration.slug);
    }, [firestore, integration.slug]);

    const { data: existingSettings, isLoading: isLoadingSettings } = useDoc(settingsRef);

    useEffect(() => {
        if (existingSettings) {
            setSettings(existingSettings);
        }
         if (typeof window !== 'undefined') {
            const url = `${window.location.origin}/api/inbound/webhook`;
            setWebhookUrl(url);
        }
    }, [existingSettings]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
        setVerificationStatus('idle');
    };

    const handleSelectChange = (id: string, value: string) => {
        setSettings(prev => ({...prev, [id]: value}));
        setVerificationStatus('idle');
    }

    const handleCopyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast({ title: 'Copied!', description: 'Webhook URL copied to clipboard.' });
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
                            (integration.slug === 'inbound-new' && !!settings.apiKey);
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
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Setup Instructions</AlertTitle>
                            <AlertDescription>
                                Copy the webhook URL below and paste it into the "Webhook URL" field in your inbound.new account settings.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="webhookUrl">Webhook URL</Label>
                            <div className="flex items-center gap-2">
                                <Input id="webhookUrl" readOnly value={webhookUrl} className="bg-muted" />
                                <Button type="button" variant="outline" size="icon" onClick={handleCopyWebhookUrl}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input id="apiKey" type="password" placeholder="inbound_xxxxxxxxxxxxxxxx" value={settings.apiKey || ''} onChange={handleInputChange} />
                            <p className="text-sm text-muted-foreground">
                                Your API key from the inbound.new dashboard. This is used to verify incoming webhook requests.
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

    const isSaveDisabled = () => {
        if (isSaving || isLoadingSettings) return true;
        if (integration.slug === 'mailgun' && (!settings.apiKey || !settings.domain)) return true;
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
                        {integration.slug === 'mailgun' ? 'Verify & Save' : 'Save'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
