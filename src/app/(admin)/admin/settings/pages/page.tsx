
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";
import { Separator } from "@/components/ui/separator";

const samplePages = [
    { id: "1", name: "Home Page Sections", status: "Published" },
    { id: "2", name: "About Us", status: "Published" },
    { id: "3", name: "Contact Us", status: "Published" },
    { id: "4", name: "Terms of Service", status: "Published" },
    { id: "5", name: "Privacy Policy", status: "Draft" },
    { id: "6", name: "FAQ", status: "Published" },
]

const samplePosts = [
    { id: "post-1", name: "Why You Should Use a Temporary Email Address", status: "Published" },
    { id: "post-2", name: "Top 5 Use Cases for Developers & QA Testers", status: "Published" },
    { id: "post-3", name: "Our New Feature: Custom Domains", status: "Draft" },
]

export default function ManagePages() {
  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Manage Pages</CardTitle>
                <CardDescription>
                Create, edit, and manage the static content pages on your site.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={samplePages} filterColumn="name" addLabel="Add New Page" onAdd={() => {}} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Manage Blog Posts</CardTitle>
                <CardDescription>
                Write, edit, and publish articles for your blog.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={samplePosts} filterColumn="name" addLabel="Add New Post" onAdd={() => {}} />
            </CardContent>
        </Card>
    </div>
  );
}
