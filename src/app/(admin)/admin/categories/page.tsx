'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
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
import { Card, CardContent } from '@/components/ui/card';
import { getCategoryColumns } from './columns';
import { CategoryDialog } from './category-dialog';
import type { Category } from './types';

export default function AdminCategoriesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'categories');
    }, [firestore]);

    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    const handleAdd = () => {
        setEditingCategory(null);
        setDialogOpen(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setDialogOpen(true);
    };

    const handleDelete = (category: Category) => {
        setDeletingCategory(category);
    };

    const confirmDelete = async () => {
        if (!deletingCategory || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'categories', deletingCategory.id));
            toast({ title: 'Success', description: 'Category deleted successfully.' });
        } catch (error: any) {
            toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
        } finally {
            setDeletingCategory(null);
        }
    };
    
    const handleSave = async (values: Omit<Category, 'id' | 'postCount'>) => {
        if (!firestore) return;
        try {
            if (editingCategory) {
                const categoryRef = doc(firestore, 'categories', editingCategory.id);
                await updateDoc(categoryRef, values);
                toast({ title: 'Success', description: 'Category updated successfully.' });
            } else {
                await addDoc(collection(firestore, 'categories'), {
                    ...values,
                    postCount: 0,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'Category created successfully.' });
            }
            setDialogOpen(false);
        } catch (error: any) {
            toast({ title: 'Error saving category', description: error.message, variant: 'destructive' });
        }
    };

    const columns = useMemo(() => getCategoryColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={categories || []}
                        filterColumn="name"
                        onAdd={handleAdd}
                        addLabel="Add Category"
                    />
                </CardContent>
            </Card>
            
            <CategoryDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                category={editingCategory}
            />

            <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category
                             <span className="font-bold"> "{deletingCategory?.name}"</span>.
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
