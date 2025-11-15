
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle2, XCircle, Users, BarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Plan } from "./data"

const FeatureCell = ({ value }: { value: boolean }) => (
    <div className="flex justify-start">
        {value ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
    </div>
);


export const getPlanColumns = (
    onEdit: (plan: Plan) => void,
    onDelete: (plan: Plan) => void
): ColumnDef<Plan>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium text-left">{row.getValue("name")}</div>
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))
      const cycle = row.original.cycle;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="font-medium text-left">{formatted}<span className="text-xs text-muted-foreground">/{cycle.slice(0,2)}</span></div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <div className="text-left"><Badge variant={status === 'active' ? 'default' : 'secondary'} className="capitalize">{status}</Badge></div>
    }
  },
  {
    accessorKey: "features.maxInboxes",
    header: "Inboxes",
    cell: ({ row }) => <div className="text-left">{row.original.features.maxInboxes}</div>,
  },
  {
    accessorKey: "features.teamMembers",
    header: "Team Seats",
    cell: ({ row }) => {
      const teamMembers = row.original.features.teamMembers || 0;
      return (
        <div className="flex items-center justify-start gap-1">
          <Users className="h-4 w-4 text-muted-foreground"/>
          <span>{teamMembers}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "features.apiAccess",
    header: "API",
    cell: ({ row }) => <FeatureCell value={row.original.features.apiAccess} />
  },
  {
    accessorKey: "features.usageAnalytics",
    header: "Analytics",
    cell: ({ row }) => {
       const hasAnalytics = row.original.features.usageAnalytics;
       return (
        <div className="flex justify-start">
            {hasAnalytics ? <BarChart className="h-5 w-5 text-blue-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
        </div>
       )
    }
  },
  {
    accessorKey: "features.prioritySupport",
    header: "Support",
    cell: ({ row }) => <FeatureCell value={row.original.features.prioritySupport} />
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as any;
        const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        return <div className="text-left">{date.toLocaleDateString()}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const plan = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(plan.id)}
            >
              Copy Plan ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(plan)}>Edit Plan</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(plan)} className="text-red-600">Delete Plan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
