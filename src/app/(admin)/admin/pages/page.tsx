"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FilePenLine, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';

const pages = [
    { id: "home", name: "Home Page", status: "Published" },
    { id: "features-page", name: "Features", status: "Published" },
    { id: "pricing-page", name: "Pricing", status: "Published" },
    { id: "blog-page", name: "Blog", status: "Published" },
    { id: "api-page", name: "API", status: "Published" },
    { id: "about", name: "About Us", status: "Published" },
    { id: "contact", name: "Contact Us", status: "Published" },
    { id: "faq-page", name: "FAQ", status: "Published" },
    { id: "terms", name: "Terms of Service", status: "Published" },
    { id: "privacy", name: "Privacy Policy", status: "Draft" },
];

export default function AdminPagesPage() {
    const [pageList, setPageList] = useState(pages);
    const router = useRouter();

    const handleStatusChange = (pageId: string, newStatus: boolean) => {
        setPageList(currentPages => 
            currentPages.map(p => 
                p.id === pageId ? { ...p, status: newStatus ? 'Published' : 'Draft' } : p
            )
        );
        // In a real app, you would also save this change to your database here.
        console.log(`Page ${pageId} status changed to ${newStatus ? 'Published' : 'Draft'}`);
    };
    
    const handleEdit = (id: string) => {
        router.push(`/admin/pages/edit/${id}`);
    };

    const handleDelete = (id: string) => {
        console.log(`Deleting page ${id}`);
        // Here you would typically show a confirmation dialog before deleting.
        setPageList(currentPages => currentPages.filter(p => p.id !== id));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Pages</CardTitle>
                <CardDescription>Edit content, manage visibility, and organize your website's pages.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flow-root">
                    <div className="-my-4 divide-y divide-border">
                        {pageList.map((page) => (
                            <div key={page.id} className="flex items-center justify-between gap-4 py-4">
                                <div className='flex items-center gap-4'>
                                    <p className="font-medium text-foreground">{page.name}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id={`status-switch-${page.id}`} 
                                            checked={page.status === 'Published'}
                                            onCheckedChange={(checked) => handleStatusChange(page.id, checked)}
                                        />
                                        <Label htmlFor={`status-switch-${page.id}`} className="text-sm text-muted-foreground">
                                            {page.status}
                                        </Label>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(page.id)}>
                                        <FilePenLine className="h-4 w-4" />
                                        <span className="sr-only">Edit Page</span>
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(page.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete Page</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
