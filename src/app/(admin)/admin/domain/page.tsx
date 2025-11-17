'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { getAllowedDomainColumns } from "./allowed-columns";
import { Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import type { AllowedDomain } from "./allowed-columns";
import { AddAllowedDomainDialog } from './add-allowed-domain';
import { EditAllowedDomainDialog } from './edit-allowed-domain';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

export default function AdminDomainPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingDomain, setEditingDomain] = useState<AllowedDomain | null>(null);
    const [deletingDomain, setDeletingDomain] = useState<AllowedDomain | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const allowedDomainsQuery = useMemoFirebase(() => firestore ? collection(firestore, "allowed_domains"): null, [firestore]);
    
    const { data: allowedDomains, isLoading: isLoadingAllowed } = useCollection<AllowedDomain>(allowedDomainsQuery);

    const handleEdit = (domain: AllowedDomain) => {
        setEditingDomain(domain);
        setIsEditOpen(true);
    };

    const handleDelete = (domain: AllowedDomain) => {
        setDeletingDomain(domain);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingDomain || !firestore) return;
        try {
            await deleteDoc(doc(firestore, "allowed_domains", deletingDomain.id));
            toast({
                title: "Success",
                description: "Domain deleted successfully."
            })
        } catch (error: any) {
            toast({
                title: "Error deleting domain",
                description: error.message || "An unknown error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsDeleteOpen(false);
            setDeletingDomain(null);
        }
    }

    const allowedColumns = useMemo(() => getAllowedDomainColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);

    if (isLoadingAllowed) {
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
            columns={allowedColumns}
            data={allowedDomains || []}
            filterColumn="domain"
            addLabel="Add Domain"
            onAdd={() => setIsAddOpen(true)}
          />
        </CardContent>
      </Card>
      
      <AddAllowedDomainDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EditAllowedDomainDialog
          domain={editingDomain}
          isOpen={isEditOpen}
          onClose={() => {
              setIsEditOpen(false);
              setEditingDomain(null);
          }}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      domain <span className="font-bold">{deletingDomain?.domain}</span> and it can no longer be used for generating emails.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
