
'use client';
import { useState, useMemo, useCallback } from 'react';
import { DataTable } from "@/components/admin/data-table";
import { getUserColumns } from "./columns";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { User } from '@/types';
import type { Plan } from '../packages/data';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ManageUserDialog } from './manage-user-dialog';

export default function AdminUsersPage() {
    const firestore = useFirestore();

    const [managingUser, setManagingUser] = useState<User | null>(null);

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, "users") : null, [firestore]);
    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);

    const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);

    const handleManageUser = useCallback((user: User) => {
        setManagingUser(user);
    }, []);

    const columns = useMemo(() => {
        const plansMap = new Map(plans?.map(p => [p.id, p.name]));
        return getUserColumns(handleManageUser, plansMap);
    }, [plans, handleManageUser]);

    if (usersLoading || plansLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

  return (
    <>
        <Card>
            <CardContent className="p-0">
                <DataTable 
                    columns={columns} 
                    data={users || []} 
                    filterColumn="email"
                />
            </CardContent>
        </Card>
        
        <ManageUserDialog
            user={managingUser}
            plans={plans || []}
            isOpen={!!managingUser}
            onClose={() => setManagingUser(null)}
        />
    </>
  );
}

    
