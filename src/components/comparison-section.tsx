
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

interface ComparisonSectionProps {
  content: {
    title: string;
    description: string;
    items: { feature: string; tempmailoz: boolean; others: boolean }[];
  }
}

export function ComparisonSection({ content }: ComparisonSectionProps) {

  if (!content || !content.items) {
    return null;
  }

  return (
    <section id="comparison">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    {content.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
            </div>
        )}
        <Card className="border">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">Feature</TableHead>
                            <TableHead className="text-center font-bold text-lg text-primary">Tempmailoz</TableHead>
                            <TableHead className="text-center">Other Services</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {content.items.map((item: any) => (
                            <TableRow key={item.feature}>
                                <TableCell className="font-medium">{item.feature}</TableCell>
                                <TableCell className="text-center">
                                    {item.tempmailoz ? <Check className="h-6 w-6 text-green-500 mx-auto" /> : <X className="h-6 w-6 text-red-500 mx-auto" />}
                                </TableCell>
                                <TableCell className="text-center">
                                    {item.others ? <Check className="h-6 w-6 text-green-500 mx-auto" /> : <X className="h-6 w-6 text-red-500 mx-auto" />}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </section>
  );
}
