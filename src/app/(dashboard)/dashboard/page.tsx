'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Inbox, Mail, Archive, Clock, AlertTriangle, Package, Users, Activity, Globe } from "lucide-react";
import { collection, query, where } from "firebase/firestore";
import { type Inbox as InboxType, type Email } from "@/types";
import { StatCard } from "@/components/admin/stat-card";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const inboxesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'inboxes'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: inboxes, isLoading: isLoadingInboxes } = useCollection<InboxType>(inboxesQuery);

  // Note: Fetching all emails for all inboxes can be inefficient for users with many inboxes.
  // For this implementation, we will rely on aggregated data if available, or process client-side.
  // A more scalable solution might involve Cloud Functions to update aggregated stats on a user document.

  const stats = useMemo(() => {
    if (!inboxes) return {
        totalInboxes: 0,
        activeInboxes: 0,
        expiredInboxes: 0,
        archivedInboxes: 0,
        totalEmails: 0,
        unreadEmails: 0,
        archivedEmails: 0, // This would require deeper queries
        totalAttachments: 0, // This also requires deeper queries
        storageUsed: 0, // This also requires deeper queries
    };
    
    const now = new Date();
    const active = inboxes.filter(i => new Date(i.expiresAt) > now);
    const expired = inboxes.length - active.length;
    const archived = inboxes.filter(i => i.isArchived).length;
    const totalEmails = inboxes.reduce((sum, i) => sum + (i.emailCount || 0), 0);
    
    // Unread, Archived emails, attachments, and storage would ideally be aggregated
    // on the user profile or fetched with more complex queries.
    // For now, we'll show what's readily available.

    return {
        totalInboxes: inboxes.length,
        activeInboxes: active.length,
        expiredInboxes: expired,
        archivedInboxes: archived,
        totalEmails: totalEmails,
        unreadEmails: 0, // Placeholder
        archivedEmails: 0, // Placeholder
        totalAttachments: 0, // Placeholder
        storageUsed: 0, // Placeholder
    }
  }, [inboxes]);

  const isLoading = isUserLoading || isLoadingInboxes;

  const statCards = [
    { title: "Total Inboxes", value: stats.totalInboxes, icon: <Inbox className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Active Inboxes", value: stats.activeInboxes, icon: <Activity className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Expired Inboxes", value: stats.expiredInboxes, icon: <Clock className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Archived Inboxes", value: stats.archivedInboxes, icon: <Archive className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Total Emails", value: stats.totalEmails, icon: <Mail className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Unread Emails", value: "N/A", icon: <Mail className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Archived Emails", value: "N/A", icon: <Archive className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
    { title: "Storage Used", value: "N/A", icon: <Globe className="h-4 w-4 text-muted-foreground" />, loading: isLoading },
  ];

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map(stat => (
                <StatCard 
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    loading={stat.loading}
                />
            ))}
        </div>
         <div className="mt-8">
            {/* Additional dashboard components can go here */}
        </div>
    </div>
  );
}
