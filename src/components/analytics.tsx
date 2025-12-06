
'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Script from "next/script";

const GoogleAnalytics = () => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-analytics') : null, [firestore]);
    const { data: settings } = useDoc(settingsRef);

    if (!settings?.measurementId) {
        return null;
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${settings.measurementId}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${settings.measurementId}');
                `}
            </Script>
        </>
    );
};

const GoogleAdSense = () => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-adsense') : null, [firestore]);
    const { data: settings } = useDoc(settingsRef);

    if (!settings?.clientId) {
        return null;
    }
    
    return (
        <Script
            id="adsense-script"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.clientId}`}
            crossOrigin="anonymous"
        />
    );
};


export function Analytics() {
    return (
        <>
            <GoogleAnalytics />
            <GoogleAdSense />
        </>
    )
}
