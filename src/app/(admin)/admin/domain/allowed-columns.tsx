
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
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type AllowedDomain = {
  id: string
  domain: string
  description: string
  tier: "free" | "premium"
  createdAt: string
}

export const allowedDomainColumns: ColumnDef<AllowedDomain>[] = [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Domain
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => {
      const tier = row.getValue("tier") as string
      return (
        <Badge variant={tier === "premium" ? "default" : "secondary"} className="capitalize">
          {tier}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{date.toLocaleDateString()}</div>
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
            <DropdownMenuItem>Edit Domain</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Domain</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
