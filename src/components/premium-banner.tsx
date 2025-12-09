
'use client';

import { useUser } from "@/firebase";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Zap } from "lucide-react";

export function PremiumBanner() {
    const { userProfile } = useUser();

    // Don't show the banner to pro users
    if (userProfile?.planId === 'pro' || userProfile?.isAdmin) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary"/>
                        Upgrade to Premium
                    </CardTitle>
                    <CardDescription>
                        Unlock powerful features like unlimited inboxes, custom domains, and an ad-free experience.
                    </CardDescription>
                </div>
                <Button asChild>
                    <Link href="/pricing">View Plans</Link>
                </Button>
            </CardHeader>
        </Card>
    )
}
