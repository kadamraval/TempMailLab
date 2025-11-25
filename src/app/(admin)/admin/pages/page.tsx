
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FilePenLine, Trash2, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const pages = [
    { id: "home", name: "Home Page", status: "Published" },
    { id: "about", name: "About Us", status: "Published" },
    { id: "contact", name: "Contact Us", status: "Published" },
    { id: "terms", name: "Terms of Service", status: "Published" },
    { id: "privacy", name: "Privacy Policy", status: "Draft" },
    { id: "faq-page", name: "FAQ", status: "Published" },
];

export default function AdminPagesPage() {
    const [pageList, setPageList] = useState(pages);

    // This is a placeholder function for the hide toggle
    const handleHideToggle = (id: string) => {
        // In a real app, this would update the page status in a database
        console.log(`Toggling visibility for page ${id}`);
    };
    
    // This is a placeholder function for editing
    const handleEdit = (id: string) => {
        console.log(`Editing page ${id}`);
        // router.push(`/admin/pages/edit/${id}`);
    };

    // This is a placeholder function for deleting
    const handleDelete = (id: string) => {
        console.log(`Deleting page ${id}`);
        // Show confirmation dialog and then delete from database
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Pages</CardTitle>
                <CardDescription>Edit content, manage visibility, and organize your website's pages.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead>Page Name</TableHead>
                            <TableHead className="text-right w-[200px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageList.map((page) => (
                            <TableRow key={page.id}>
                                <TableCell>
                                    <Badge variant={page.status === 'Published' ? 'default' : 'secondary'}>{page.status}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{page.name}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(page.id)}>
                                        <FilePenLine className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleHideToggle(page.id)}>
                                        <EyeOff className="h-4 w-4" />
                                    </Button>
                                     <Button variant="destructive-outline" size="icon" onClick={() => handleDelete(page.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
