"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseCasesSection } from '@/components/use-cases-section';
import { FeaturesSection } from '@/components/features-section';
import { Testimonials } from '@/components/testimonials';
import { FaqSection } from '@/components/faq-section';
import { ExclusiveFeatures } from '@/components/exclusive-features';
import { ComparisonSection } from '@/components/comparison-section';

const sections = [
    { id: "use-cases", name: "Use Cases", component: <UseCasesSection removeBorder={true} /> },
    { id: "features", name: "Features", component: <FeaturesSection showTitle={false} /> },
    { id: "exclusive-features", name: "Exclusive Features", component: <ExclusiveFeatures removeBorder={true} /> },
    { id: "comparison", name: "Comparison", component: <ComparisonSection showTitle={false} removeBorder={true} /> },
    { id: "testimonials", name: "Testimonials", component: <Testimonials /> },
    { id: "faq", name: "FAQ", component: <FaqSection removeBorder={true} /> },
];

export default function AdminSectionsPage() {
    const [selectedSection, setSelectedSection] = useState(sections[0]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Section Styles</CardTitle>
                <CardDescription>
                    Select a section to preview its design and control its CSS properties like colors and spacing globally.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Section List & Preview */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Available Sections</TableHead>
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Live Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <div className="border rounded-lg p-4">
                                  {selectedSection.component}
                               </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Properties Editor */}
                    <div className="lg:col-span-1">
                        {selectedSection && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>CSS Properties for: {selectedSection.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <Input type="color" defaultValue="#FFFFFF" className="h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gradient Color</Label>
                                        <Input type="color" defaultValue="#F0F8FF" className="h-12" />
                                    </div>
                                    
                                    <div className="space-y-4 rounded-md border p-4">
                                        <Label>Margin (px)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" placeholder="Top" />
                                            <Input type="number" placeholder="Bottom" />
                                            <Input type="number" placeholder="Left" />
                                            <Input type="number" placeholder="Right" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 rounded-md border p-4">
                                        <Label>Padding (px)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" placeholder="Top" defaultValue="64" />
                                            <Input type="number" placeholder="Bottom" defaultValue="64"/>
                                            <Input type="number" placeholder="Left" />
                                            <Input type="number" placeholder="Right" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <Button className="w-full">Save Styles</Button>
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
