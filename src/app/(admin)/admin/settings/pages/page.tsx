
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

const samplePages = [
    { id: "1", name: "About Us", status: "Published" },
    { id: "2", name: "Contact Us", status: "Published" },
    { id: "3", name: "Terms of Service", status: "Published" },
    { id: "4", name: "Privacy Policy", status: "Draft" },
    { id: "5", name: "FAQ", status: "Published" },
]

export default function ManagePages() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Pages</CardTitle>
        <CardDescription>
          Create, edit, and manage the static pages on your site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={samplePages} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
