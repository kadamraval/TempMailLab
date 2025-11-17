'use client';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from "@/components/admin/data-table";
import { getPlanColumns } from "./columns";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { type Plan } from './data';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { deletePlanAction } from '@/lib/actions/plans';
import { Button } from '@/components/ui/button';

export default function AdminPackagesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    // State for CRUD operations
    const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data from Firestore
    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
    const { data: plans, isLoading } = useCollection<Plan>(plansQuery);

    // Handlers for CRUD actions
    const handleAdd = useCallback(() => {
        router.push('/admin/packages/add');
    }, [router]);

    const handleEdit = useCallback((plan: Plan) => {
        router.push(`/admin/packages/edit/${plan.id}`);
    }, [router]);

    const handleDelete = useCallback((plan: Plan) => {
        if (plan.id === 'free-default') {
            toast({
                title: "Action Not Allowed",
                description: "The 'Free' plan is a system-critical fallback and cannot be deleted.",
                variant: "destructive",
            });
            return;
        }
        setDeletingPlan(plan);
    }, [toast]);

    const confirmDelete = async () => {
        if (!deletingPlan) return;
        setIsDeleting(true);
        try {
            const result = await deletePlanAction(deletingPlan.id);
            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: "Success",
                description: "Plan deleted successfully."
            });
        } catch (error: any) {
            toast({
                title: "Error deleting plan",
                description: error.message || "An unknown error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setDeletingPlan(null);
        }
    };

    // Memoize columns to prevent re-creation on every render
    const columns = useMemo(() => getPlanColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);

    if (isLoading) {
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
                    data={plans || []} 
                    filterColumn="name" 
                    onAdd={handleAdd}
                    addLabel="Add Plan"
                />
            </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        plan <span className="font-bold">{deletingPlan?.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
