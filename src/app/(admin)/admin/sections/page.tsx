
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FilePenLine } from 'lucide-react';

const sections = [
    { id: "use-cases", name: "Use Cases" },
    { id: "features", name: "Features" },
    { id: "exclusive-features", name: "Exclusive Features" },
    { id: "comparison", name: "Comparison Table" },
    { id: "pricing", name: "Pricing" },
    { id: "pricing-comparison", name: "Pricing Feature Comparison Table" },
    { id: "blog", name: "Blog" },
    { id: "testimonials", name: "Testimonials" },
    { id: "faq", name: "FAQ" },
    { id: "stay-connected", name: "Stay Connected (Newsletter)" },
    { id: "contact-form", name: "Contact Us Form" },
];

export default function AdminSectionsPage() {
    const router = useRouter();

    const handleEditClick = (sectionId: string) => {
        router.push(`/admin/sections/edit/${sectionId}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Section Styles</CardTitle>
                <CardDescription>
                    Select a section to edit its global CSS properties like colors and spacing.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
