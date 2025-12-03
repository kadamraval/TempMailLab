"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FilePenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sections = [
    { id: "inbox", name: "Inbox", pages: ["Home", "Dashboard"] },
    { id: "top-title", name: "Top Title", pages: ["Home", "Features", "Pricing", "Blog", "API"] },
    { id: "content", name: "Content (WYSIWYG)", pages: ["About", "Privacy", "Terms"] },
    { id: "why", name: "Why", pages: ["Home"] },
    { id: "features", name: "Features", pages: ["Home", "Features"] },
    { id: "exclusive-features", name: "Exclusive Features", pages: ["Home", "Features"] },
    { id: "comparison", name: "Comparison", pages: ["Home", "Features"] },
    { id: "pricing", name: "Pricing", pages: ["Home", "Pricing"] },
    { id: "pricing-comparison", name: "Price Comparison", pages: ["Pricing"] },
    { id: "blog", name: "Blog", pages: ["Home", "Blog"] },
    { id: "testimonials", name: "Testimonials", pages: ["Home"] },
    { id: "faq", name: "FAQ", pages: ["Home", "Features", "Pricing", "Blog", "API", "Contact"] },
    { id: "newsletter", name: "Newsletter", pages: ["Home", "Features", "Pricing", "Blog", "API", "Contact"] },
    { id: "contact-form", name: "Contact", pages: ["Contact"] },
    { id: "knowledgebase", name: "Knowledgebase", pages: ["Future Use"] },
];


export default function AdminSectionsPage() {
    const router = useRouter();

    const handleEditClick = (sectionId: string) => {
        router.push(`/admin/sections/edit/${sectionId}`);
    };

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Section Name</TableHead>
                            <TableHead>Located On</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sections.map((section) => (
                            <TableRow key={section.id}>
                                <TableCell className="font-medium">{section.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {section.pages.map(page => (
                                            <Badge key={page} variant="secondary">{page}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(section.id)}>
                                        <FilePenLine className="h-4 w-4 mr-2" />
                                        Edit
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
