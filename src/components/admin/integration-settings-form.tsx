
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
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
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
    const [settings, setSettings] = useState({
        enabled: false,
        apiKey: "",
        domain: "",
        region: "US" as "US" | "EU",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [verificationMessage, setVerificationMessage] = useState('');

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
                region: existingSettings.region ?? "US",
            })
        }
    }, [existingSettings]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
        setVerificationStatus('idle');
    };

    const handleRegionChange = (value: "US" | "EU") => {
        setSettings(prev => ({ ...prev, region: value }));
        setVerificationStatus('idle');
    };

    const handleSaveChanges = async () => {
        if (integration.slug !== 'mailgun' || !settingsRef) return;
        
        setIsSaving(true);
        setVerificationStatus('idle');
        setVerificationMessage('Verifying credentials...');
        
        try {
            // Step 1: Verify credentials with the new server action
            const verificationResult = await verifyMailgunSettingsAction({
                apiKey: settings.apiKey,
                domain: settings.domain,
                region: settings.region,
            });

            setVerificationMessage(verificationResult.message);

            if (!verificationResult.success) {
                setVerificationStatus('error');
                // The toast is redundant if the alert is shown, but can be useful
                toast({ title: "Verification Failed", description: verificationResult.message, variant: "destructive" });
                return; // Stop execution
            }

            setVerificationStatus('success');

            // Step 2: If verification is successful, save the settings to Firestore
            const settingsToSave = {
                apiKey: settings.apiKey,
                domain: settings.domain,
                region: settings.region,
                enabled: true // Enable since verification passed and settings are saved
            };

            await setDoc(settingsRef, settingsToSave, { merge: true });

            toast({
                title: "Settings Saved & Verified",
                description: `Mailgun configuration has been successfully verified and saved.`,
            });
            
            // Optionally redirect after a short delay
            setTimeout(() => router.push('/admin/settings/integrations'), 2000);

        } catch (error: any) {
            console.error("Error saving settings:", error);
            setVerificationStatus('error');
            setVerificationMessage(error.message || "An unexpected client-side error occurred.");
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

    const isMailgunFormIncomplete = integration.slug === 'mailgun' && (!settings.apiKey || !settings.domain);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{integration.title} Settings</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {renderFormFields()}

                {verificationStatus !== 'idle' && verificationMessage && (
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
                    <Button onClick={handleSaveChanges} disabled={integration.slug !== 'mailgun' || isSaving || isLoadingSettings || isMailgunFormIncomplete}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Save
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
