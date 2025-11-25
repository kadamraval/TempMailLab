
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const comparisonFeatures = [
    { feature: "Instant Address Generation", tempmailoz: true, others: true },
    { feature: "No Registration Required", tempmailoz: true, others: true },
    { feature: "Automatic Email Deletion", tempmailoz: true, others: false },
    { feature: "Ad-Free Experience", tempmailoz: true, others: false },
    { feature: "Custom Domain Names", tempmailoz: true, others: false },
    { feature: "Developer API Access", tempmailoz: true, others: false },
    { feature: "Email Forwarding", tempmailoz: true, others: false },
    { feature: "Secure Password Protection", tempmailoz: true, others: false },
];


export function ComparisonSection({ removeBorder }: { removeBorder?: boolean }) {
  return (
    <section id="comparison" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Tempmailoz Vs Others
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how Tempmailoz stacks up against other temporary email providers. We focus on privacy, features, and a clean user experience.
          </p>
        </div>
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
                        {comparisonFeatures.map((item) => (
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
