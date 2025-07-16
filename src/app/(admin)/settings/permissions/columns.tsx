
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export const getColumns = (
    handleUpdateAdminStatus: (uid: string, isAdmin: boolean) => void
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
  },
  {
    accessorKey: "isAdmin",
    header: "Admin Status",
     cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
            <Switch
                id={`admin-switch-${user.uid}`}
                checked={user.isAdmin}
                onCheckedChange={(checked) => handleUpdateAdminStatus(user.uid, checked)}
            />
            <label htmlFor={`admin-switch-${user.uid}`}>
                 <Badge variant={user.isAdmin ? 'default' : 'secondary'}>{user.isAdmin ? 'Admin' : 'User'}</Badge>
            </label>
        </div>
      )
    },
  },
    {
    accessorKey: "createdAt",
    header: "Joined At",
  },
]
