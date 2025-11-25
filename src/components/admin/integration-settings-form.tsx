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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


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
        headerName: 'x-inbound-secret',
        webhookPath: '/api/inbound-webhook'
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

    useEffect(() => {
        if (existingSettings) {
            setSettings(prev => ({ ...prev, ...existingSettings }));
        } else if (!isLoadingSettings && integration.slug === 'inbound-new' && !settings.headerValue) {
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
        setSettings(prev => ({ ...prev, headerValue: newSecret, enabled: true }));
        if (regenerate) {
             toast({ title: 'New Secret Generated', description: 'Click "Save Changes" to apply it.' });
        }
    }


    const handleSaveChanges = async () => {
        if (!settingsRef) return;
        
        setIsSaving(true);
        setVerificationStatus('idle');
        
        try {
            const settingsToSave = { ...settings, enabled: true };

            await setDoc(settingsRef, settingsToSave, { merge: true });

            toast({
                title: "Settings Saved",
                description: `${integration.title} configuration has been successfully saved.`,
            });
            
            router.refresh(); 
            router.push('/admin/settings/integrations');

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
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Configuration Disabled</AlertTitle>
                        <AlertDescription>
                            The Mailgun integration is currently disabled in favor of `inbound.new`. Please configure `inbound.new` for email processing.
                        </AlertDescription>
                    </Alert>
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
                                        In your `inbound.new` dashboard, paste your app's full public URL into the "Webhook URL" or "Endpoint" field. For development, use your ngrok or port-forwarded public URL.
                                        <p className="text-xs mt-1">Example: `https://your-app.com{settings.webhookPath}`</p>
                                    </li>
                                    <li>
                                        Enter your `inbound.new` API Key below if required by the service for certain operations.
                                    </li>
                                    <li>
                                        Optionally, for added webhook security, configure custom headers in `inbound.new` and save the matching `Header Name` and `Header Value` below.
                                    </li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                         <div className="space-y-2">
                            <Label htmlFor="webhookPath">Your Webhook URL Path (Read-only)</Label>
                            <div className="flex items-center gap-2">
                                <Input id="webhookPath" readOnly value={settings.webhookPath || ''} className="bg-muted font-mono" />
                                <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(settings.webhookPath, 'Webhook Path')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key (Optional)</Label>
                            <Input id="apiKey" type="password" placeholder="Enter your inbound.new API Key" value={settings.apiKey || ''} onChange={handleInputChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="headerName">Webhook Header Name (Optional)</Label>
                                <Input id="headerName" placeholder="e.g., x-inbound-secret" value={settings.headerName || ''} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="headerValue">Webhook Header Value (Optional)</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="headerValue" type="password" placeholder="Enter your secret" value={settings.headerValue || ''} onChange={handleInputChange} />
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button type="button" variant="outline" size="icon" onClick={() => handleGenerateSecret(true)}>
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Generate a new secret. You must click 'Save Changes' to apply it.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
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

    const isSaveDisabled = isSaving || isLoadingSettings;

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
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaveDisabled}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
