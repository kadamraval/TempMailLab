"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const pagesData = [
  { path: "/", views: "12,402", unique: "9,801" },
  { path: "/pricing", views: "8,921", unique: "6,502" },
  { path: "/features", views: "7,301", unique: "5,123" },
  { path: "/blog", views: "5,102", unique: "3,876" },
  { path: "/login", views: "3,254", unique: "2,987" },
];

export function TopPagesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page Path</TableHead>
          <TableHead className="text-right">Views</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagesData.map((page) => (
          <TableRow key={page.path}>
            <TableCell className="font-medium">{page.path}</TableCell>
            <TableCell className="text-right">{page.views}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
