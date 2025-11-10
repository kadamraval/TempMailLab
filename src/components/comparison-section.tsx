
"use client"

import { Check, X, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const comparisonData = [
  { feature: "Custom Domains", other: false, tempmailer: true },
  { feature: "Email Forwarding", other: false, tempmailer: true },
  { feature: "Ad-Free Experience", other: false, tempmailer: true },
  { feature: "Developer API", other: false, tempmailer: true },
  { feature: "Extended Inbox Lifetime", other: false, tempmailer: true },
  { feature: "Instant Address Generation", other: true, tempmailer: true },
  { feature: "Basic Spam Filtering", other: true, tempmailer: true },
]

export function ComparisonSection({ removeBorder }: { removeBorder?: boolean }) {
  return (
    <section id="comparison" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Tempmailer vs. Others
          </h2>
        </div>
        <Card className={cn(removeBorder && "border-0")}>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Feature</TableHead>
                  <TableHead className="text-center">Others</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <span>Tempmailer</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((item) => (
                  <TableRow key={item.feature}>
                    <TableCell className="font-medium">{item.feature}</TableCell>
                    <TableCell className="text-center">
                      {item.other ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.tempmailer ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
