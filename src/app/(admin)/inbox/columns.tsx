
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { InboxLog } from "@/types"
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
import { MoreHorizontal, ArrowUpDown, Trash2, ShieldQuestion } from "lucide-react"
import { deleteInbox } from "@/lib/actions/inbox"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const getColumns = (
    handleAction: (action: () => Promise<{success: boolean; error?: string}>, successMessage: string) => void
): ColumnDef<InboxLog>[] => [
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
    accessorKey: "domain",
    header: "Domain",
  },
   {
    accessorKey: "userId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
     cell: ({ row }) => {
      const userId = row.getValue("userId") as string;
      return userId === 'anonymous' ? <span className="flex items-center gap-2"><ShieldQuestion className="h-4 w-4 text-muted-foreground"/>Anonymous</span> : <span className="font-mono text-xs">{userId}</span>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
   {
    accessorKey: "expiresAt",
    header: "Expires At",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inboxLog = row.original;
      
      return (
         <AlertDialog>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(inboxLog.id)}>
                    Copy Inbox ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Inbox
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the inbox log. It will not delete the associated user.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction(() => deleteInbox(inboxLog.id), 'Inbox log has been deleted.')} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]
