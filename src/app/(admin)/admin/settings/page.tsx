
"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component now solely handles redirection.
export default function SettingsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the "General" settings page by default.
        router.replace('/admin/settings/general');
    }, [router]);

    // Return null or a loader while the redirect is in progress.
    return null;
}
