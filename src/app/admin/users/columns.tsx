// @/app/admin/users/columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { upgradeUser, downgradeUser, deleteUser } from "./actions"
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

export const columns: ColumnDef<User>[] = [
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
    accessorKey: "isPremium",
    header: "Status",
     cell: ({ row }) => {
      const isPremium = row.getValue("isPremium")
      return <Badge variant={isPremium ? 'default' : 'secondary'}>{isPremium ? 'Premium' : 'Free'}</Badge>
    },
  },
  {
    accessorKey: "planType",
    header: "Plan",
  },
    {
    accessorKey: "createdAt",
    header: "Joined At",
  },
  {
    accessorKey: "inboxCount",
    header: "Inbox Count",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const { toast } = useToast()

      const handleAction = async (action: (uid: string) => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
        const result = await action(user.uid);
        if (result.success) {
            toast({ title: "Success", description: successMessage });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      };

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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.uid)}>
                    Copy user ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <span>Change Status</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleAction(upgradeUser, 'User upgraded to premium.')}>
                                <ArrowUpCircle className="mr-2 h-4 w-4"/>
                                Upgrade to Premium
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(downgradeUser, 'User downgraded to free.')}>
                                <ArrowDownCircle className="mr-2 h-4 w-4"/>
                                Downgrade to Free
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    and all their associated data from Firebase Authentication and Firestore.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction(deleteUser, 'User has been deleted.')} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]
