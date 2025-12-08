
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminAdsPage() {
    const [settings, setSettings] = useState({
        enabled: false,
        clientId: '',
        bottomBannerSlot: '',
        inboxAdSlot: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-adsense') : null, [firestore]);
    const { data: existingSettings, isLoading } = useDoc(settingsRef);

    useEffect(() => {
        if (existingSettings) {
            setSettings(existingSettings);
        }
    }, [existingSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };
    
    const handleSwitchChange = (checked: boolean) => {
        setSettings(prev => ({ ...prev, enabled: checked }));
    };

    const handleSaveChanges = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        try {
            await setDoc(settingsRef, settings, { merge: true });
            toast({ title: "Success", description: "Ad settings saved successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
        <CardTitle>Manage Ads</CardTitle>
        <CardDescription>Configure Google AdSense for the free tier.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="enable-ads" className="text-base">Enable AdSense</Label>
                <p className="text-sm text-muted-foreground">
                    Master switch to enable or disable all ads across the site.
                </p>
            </div>
            <Switch id="enable-ads" checked={settings.enabled} onCheckedChange={handleSwitchChange} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="clientId">Publisher ID</Label>
            <Input id="clientId" value={settings.clientId} onChange={handleInputChange} placeholder="pub-xxxxxxxxxxxxxxxx" />
            <p className="text-sm text-muted-foreground">Your Google AdSense publisher ID.</p>
        </div>
        <div className="space-y-2">
            <Label htmlFor="bottomBannerSlot">Bottom Banner Ad Slot ID</Label>
            <Input id="bottomBannerSlot" value={settings.bottomBannerSlot} onChange={handleInputChange} placeholder="1234567890" />
            <p className="text-sm text-muted-foreground">The ad slot ID for the sticky banner at the bottom of the page.</p>
        </div>
        <div className="space-y-2">
            <Label htmlFor="inboxAdSlot">In-Content Ad Slot ID</Label>
            <Input id="inboxAdSlot" value={settings.inboxAdSlot} onChange={handleInputChange} placeholder="0987654321" />
             <p className="text-sm text-muted-foreground">The ad slot ID for ads displayed within the content area (e.g., inside the inbox).</p>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex justify-end w-full">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
