// @/app/admin/users/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import { getUsers, upgradeUser, downgradeUser, deleteUser } from './actions'

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage your users and their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>MailTm ID</TableHead>
              <TableHead>Inbox Count</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.isPremium ? 'default' : 'secondary'}>
                      {user.isPremium ? 'Premium' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.planType}</TableCell>
                  <TableCell>{user.planExpiry}</TableCell>
                  <TableCell className="truncate max-w-xs">{user.mailTmId}</TableCell>
                  <TableCell>{user.inboxCount}</TableCell>
                  <TableCell>
                    <form>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                             <button type="submit" formAction={async () => {
                               'use server';
                               await upgradeUser(user.uid)
                             }} className="w-full">Upgrade</button>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                           <button type="submit" formAction={async () => {
                               'use server';
                               await downgradeUser(user.uid)
                             }} className="w-full">Downgrade</button>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <button type="submit" formAction={async () => {
                               'use server';
                               await deleteUser(user.uid)
                             }} className="w-full text-red-500">Delete</button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
