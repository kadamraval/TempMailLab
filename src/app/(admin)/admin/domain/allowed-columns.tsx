
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
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type AllowedDomain = {
  id: string
  domain: string
  description: string
  tier: "free" | "premium"
  createdAt: string // This could be a Date object if transformed
  // Add a function type for handlers
  onEdit: (domain: AllowedDomain) => void;
  onDelete: (domain: AllowedDomain) => void;
}

export const getAllowedDomainColumns = (
    onEdit: (domain: AllowedDomain) => void,
    onDelete: (domain: AllowedDomain) => void
): ColumnDef<AllowedDomain>[] => [
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
    accessorKey: "domain",
    header: "Domain",
    cell: ({ row }) => <div className="text-left">{row.getValue("domain")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
     cell: ({ row }) => <div className="text-left">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => {
      const tier = row.getValue("tier") as string
      return (
        <div className="text-left">
            <Badge variant={tier === "premium" ? "default" : "secondary"} className="capitalize">
              {tier}
            </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as any;
        // Firestore timestamp can be an object, handle it safely
        const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        return <div className="text-left">{date.toLocaleDateString()}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const domain = row.original

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
              onClick={() => navigator.clipboard.writeText(domain.id)}
            >
              Copy Domain ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(domain)}>Edit Domain</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(domain)} className="text-red-600">Delete Domain</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
