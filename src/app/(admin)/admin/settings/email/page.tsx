
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function EmailSettingsPage() {
    const [activeProvider, setActiveProvider] = useState<'mailgun' | 'inbound.new' | ''>('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "admin_settings", "email");
    }, [firestore]);

    const { data: emailSettings, isLoading } = useDoc(settingsRef);

    useEffect(() => {
        if (emailSettings) {
            setActiveProvider(emailSettings.provider || 'mailgun');
        } else if (!isLoading) {
            setActiveProvider('mailgun');
        }
    }, [emailSettings, isLoading]);

    const handleSave = async () => {
        if (!firestore || !settingsRef) return;
        setIsSaving(true);
        try {
            await setDoc(settingsRef, { provider: activeProvider }, { merge: true });
            toast({
                title: "Settings Saved",
                description: `Email provider has been set to ${activeProvider}.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to save email settings.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inbound Email Settings</CardTitle>
                <CardDescription>Configure which service will be used to receive and process incoming emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="provider-select">Active Email Provider</Label>
                    <Select value={activeProvider} onValueChange={(value) => setActiveProvider(value as any)}>
                        <SelectTrigger id="provider-select">
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="inbound.new">inbound.new</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Select the service that will handle incoming temporary emails. Ensure the chosen service is correctly configured.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end w-full">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
