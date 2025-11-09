
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { columns } from "./columns";
import { DataTable } from "@/components/admin/data-table";
import { planSchema } from './data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Simulate a database read for tasks.
async function getPlans() {
  // This is a placeholder. In a real app, you would fetch this from a database.
  const data = [
    {
      id: "PLAN-8782",
      name: "Free",
      price: 0,
      features: "Basic features, 1 inbox",
      status: "active",
      cycle: "monthly",
    },
    {
      id: "PLAN-7878",
      name: "Premium",
      price: 9.99,
      features: "Premium features, 10 inboxes",
      status: "active",
      cycle: "monthly",
    },
    {
      id: "PLAN-1234",
      name: "Business",
      price: 29.99,
      features: "Business features, unlimited inboxes",
      status: "archived",
      cycle: "yearly",
    },
  ];

  return z.array(planSchema).parse(data)
}

export default async function AdminPackagesPage() {
  const plans = await getPlans();

  return (
     <Card>
        <CardHeader>
            <CardTitle>Manage Plans</CardTitle>
            <CardDescription>View, create, and manage user subscription plans.</CardDescription>
        </CardHeader>
        <CardContent>
            <DataTable columns={columns} data={plans} filterColumn="name" />
        </CardContent>
    </Card>
  );
}
