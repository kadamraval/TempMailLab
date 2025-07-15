// @/app/admin/users/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUsers } from './actions'
import { firestore } from '@/lib/firebase-admin'
import Link from 'next/link'
import { UserDataTable } from './data-table'
import { columns } from './columns'
import type { User } from '@/types'

export const revalidate = 0; // Don't cache this page
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const isFirebaseConfigured = !!firestore;

  let users: User[] = [];
  if (isFirebaseConfigured) {
    users = await getUsers();
  } else {
    // Dummy data for when Firebase is not configured
    users = [
      { uid: 'dummy1', email: 'user1@example.com', isPremium: true, planType: 'premium', createdAt: '2024-07-20', inboxCount: 15 },
      { uid: 'dummy2', email: 'user2@example.com', isPremium: false, planType: 'free', createdAt: '2024-07-19', inboxCount: 3 },
      { uid: 'dummy3', email: 'user3@example.com', isPremium: true, planType: 'premium', createdAt: '2024-07-18', inboxCount: 45 },
    ];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage your users and their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isFirebaseConfigured && (
          <div className="mb-4 flex flex-col items-center justify-center gap-4 p-8 text-center bg-muted/50 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h3 className="text-xl font-semibold">Firebase Not Configured</h3>
            <p className="text-muted-foreground max-w-md">
              User management is running on dummy data because Firebase credentials are not set up.
              Please add your Firebase service account details in the settings to manage real users.
            </p>
            <Button asChild>
              <Link href="/admin/settings/integrations/firebase">Go to Settings</Link>
            </Button>
          </div>
        )}
         <UserDataTable columns={columns} data={users} />
      </CardContent>
    </Card>
  )
}
