"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { comparisonFeatures as defaultContent } from "@/lib/content-data";

export function ComparisonSection({ removeBorder, showTitle = true }: { removeBorder?: boolean, showTitle?: boolean }) {
  const firestore = useFirestore();
  const contentId = 'comparison';
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', contentId);
  }, [firestore]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
    if (!isLoading && !content && !error && firestore) {
      const defaultData = { title: "Tempmailoz Vs Others", description: "", items: defaultContent };
      setDoc(doc(firestore, 'page_content', contentId), defaultData).catch(console.error);
    }
  }, [isLoading, content, error, firestore]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const currentContent = content || { title: "Tempmailoz Vs Others", items: defaultContent };
  
  if (!currentContent || !currentContent.items) {
    return null;
  }

  return (
    <section id="comparison">
      <div className="container mx-auto px-4">
        {showTitle && (
            <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                {currentContent.title || "Tempmailoz Vs Others"}
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
                        {currentContent.items.map((item: any) => (
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
