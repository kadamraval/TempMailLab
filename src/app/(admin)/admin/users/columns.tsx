
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
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
import type { User } from "@/types"

export const getUserColumns = (
    onManage: (user: User) => void,
    plansMap: Map<string, string>
): ColumnDef<User>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
     cell: ({ row }) => <div className="pl-4">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "planId",
    header: "Plan",
    cell: ({ row }) => {
      const planId = row.getValue("planId") as string;
      const planName = plansMap.get(planId) || 'Free';
      const isFree = planName === 'Free';
      return (
         <Badge variant={isFree ? "outline" : "default"}>{planName}</Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Registered On",
    cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as any;
        const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        return <div>{date.toLocaleDateString()}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

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
            <DropdownMenuItem onClick={() => onManage(user)}>
              Manage Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View User Details</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
