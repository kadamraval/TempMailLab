"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const sections = [
    { id: "use-cases", name: "Use Cases", description: "Displays different use cases for the service." },
    { id: "features", name: "Features", description: "Highlights the key features of the application." },
    { id: "exclusive-features", name: "Exclusive Features", description: "Showcases premium or unique features." },
    { id: "comparison", name: "Comparison", description: "Compares Tempmailoz with other services." },
    { id: "pricing", name: "Pricing", description: "Displays the available subscription plans." },
    { id: "blog", name: "Blog", description: "Shows the latest blog posts." },
    { id: "testimonials", name: "Testimonials", description: "User feedback and quotes." },
    { id: "faq", name: "FAQ", description: "Frequently Asked Questions section." },
    { id: "stay-connected", name: "Stay Connected", description: "Newsletter signup form." },
];

export default function AdminPagesPage() {
    const [selectedSection, setSelectedSection] = useState(sections[0]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Page Sections</CardTitle>
                <CardDescription>Select a section to view and edit its properties.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Section List */}
                    <div className="md:col-span-1">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Section Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sections.map((section) => (
                                        <TableRow 
                                            key={section.id} 
                                            onClick={() => setSelectedSection(section)}
                                            className={cn(
                                                "cursor-pointer",
                                                selectedSection.id === section.id && "bg-muted/50"
                                            )}
                                        >
                                            <TableCell className="font-medium">{section.name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Right Column: Properties Editor */}
                    <div className="md:col-span-2">
                        {selectedSection && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Properties for: {selectedSection.name}</CardTitle>
                                    <CardDescription>{selectedSection.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="flex items-center space-x-2">
                                        <Switch id={`visible-${selectedSection.id}`} defaultChecked />
                                        <Label htmlFor={`visible-${selectedSection.id}`}>Visible on Homepage</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="section-title">Section Title</Label>
                                        <Input id="section-title" defaultValue={selectedSection.name} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="section-description">Section Description</Label>
                                        <Textarea id="section-description" placeholder="Enter a brief description for this section." />
                                    </div>
                                    <div className="pt-4">
                                        <Button>Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
