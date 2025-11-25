
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonSectionProps {
  removeBorder?: boolean;
  content: {
    title: string;
    items: { feature: string; tempmailoz: boolean; others: boolean }[];
  }
}

export function ComparisonSection({ removeBorder, content }: ComparisonSectionProps) {

  if (!content || !content.items) {
    return null;
  }

  return (
    <section id="comparison">
      <div className="container mx-auto px-4">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                {content.title}
            </h2>
            </div>
        )}
        <Card className={cn(removeBorder && "border-0 shadow-none")}>
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
      </div>
    </section>
  );
}
