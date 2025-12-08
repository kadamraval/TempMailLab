
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import Script from "next/script";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const AdSenseAd = ({ slot, responsive = "false" }: { slot: string, responsive?: "true" | "false" }) => {
    const { userProfile } = useUser();
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-adsense') : null, [firestore]);
    const { data: settings } = useDoc(settingsRef);

    useEffect(() => {
        // Don't run if ads are disabled for the user/plan, or if settings aren't loaded
        if (userProfile?.plan?.noAds || !settings?.clientId) {
            return;
        }
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, [settings?.clientId, slot, userProfile?.plan?.noAds]);
    
    if (userProfile?.plan?.noAds || !settings?.clientId || !slot) {
        return null;
    }

    return (
        <div className="flex justify-center items-center my-4 min-h-[100px] w-full bg-muted/50 border rounded-lg">
             <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={settings.clientId}
                data-ad-slot={slot}
                data-ad-format="auto"
                data-full-width-responsive={responsive}></ins>
        </div>
    );
};


export const BottomAdBanner = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { userProfile } = useUser();
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-adsense') : null, [firestore]);
    const { data: settings } = useDoc(settingsRef);
    
    // Don't render anything if ads disabled or not configured
    if (userProfile?.plan?.noAds || !settings?.bottomBannerSlot) {
        return null;
    }

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t transition-transform duration-300 ease-in-out", isOpen ? "translate-y-0" : "translate-y-full")}>
             <div className="container mx-auto relative p-2">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
                <AdSenseAd slot={settings.bottomBannerSlot} />
            </div>
        </div>
    )
}


export default AdSenseAd;
