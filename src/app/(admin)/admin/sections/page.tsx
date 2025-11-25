
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FilePenLine } from 'lucide-react';

const sections = [
    { id: "inbox", name: "Inbox" },
    { id: "top-title", name: "Top Title" },
    { id: "why", name: "Why" },
    { id: "features", name: "Features" },
    { id: "exclusive-features", name: "Exclusive Features" },
    { id: "comparison", name: "Comparison" },
    { id: "pricing", name: "Pricing" },
    { id: "pricing-comparison", name: "Price Comparison" },
    { id: "blog", name: "Blog" },
    { id: "testimonials", name: "Testimonials" },
    { id: "faq", name: "FAQ" },
    { id: "newsletter", name: "Newsletter" },
    { id: "contact-form", name: "Contact" },
    { id: "knowledgebase", name: "Knowledgebase" },
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
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sections.map((section) => (
                            <TableRow key={section.id}>
                                <TableCell className="font-medium">{section.name}</TableCell>
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
