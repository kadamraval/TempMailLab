
'use client';
import { useState, useMemo } from 'react';
import { DataTable } from "@/components/admin/data-table";
import { getPlanColumns } from "./columns";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
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
import { PlanDialog } from './plan-dialog';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminPackagesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for CRUD operations
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

    // Fetch data from Firestore
    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
    const { data: plans, isLoading } = useCollection<Plan>(plansQuery);

    // Handlers for CRUD actions
    const handleAdd = () => {
        setSelectedPlan(null);
        setDialogOpen(true);
    };

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setDialogOpen(true);
    };

    const handleDelete = (plan: Plan) => {
        setDeletingPlan(plan);
    };

    const confirmDelete = async () => {
        if (!deletingPlan || !firestore) return;
        try {
            await deleteDoc(doc(firestore, "plans", deletingPlan.id));
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
            <CardContent>
                <DataTable 
                    columns={columns} 
                    data={plans || []} 
                    filterColumn="name" 
                    onAdd={handleAdd}
                    addLabel="Add Plan"
                />
            </CardContent>
        </Card>
        
        {/* Add/Edit Dialog */}
        <PlanDialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            plan={selectedPlan}
        />

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
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
