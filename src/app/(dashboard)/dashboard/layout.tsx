"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname } from "next/navigation";

const getTitleFromPath = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Dashboard';
    const segment = pathname.split('/dashboard/')[1] || '';
    const title = segment.split('/')[0].replace(/-/g, ' ');
    // Capitalize first letter of each word
    return title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const getDescriptionFromPath = (pathname: string): string => {
    switch (pathname) {
        case '/dashboard':
            return 'Welcome to your personal dashboard.';
        case '/dashboard/inbox':
            return 'Manage your temporary email inboxes here.';
        default:
            return 'Manage your account and settings.';
    }
}


export default function UserDashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Card>
        <CardHeader>
            <CardTitle>{getTitleFromPath(pathname)}</CardTitle>
            <CardDescription>{getDescriptionFromPath(pathname)}</CardDescription>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
  );
}
