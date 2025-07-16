
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Users, CreditCard, Activity, Inbox, UserCheck, UserX } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { getUsers } from "@/lib/actions/users"
import { useInboxLogs } from "@/hooks/useInboxLogs"
import { InboxLogsTable } from "./inbox-logs-table"

const chartData = [
  { month: "January", users: 186 },
  { month: "February", users: 305 },
  { month: "March", users: 237 },
  { month: "April", users: 73 },
  { month: "May", users: 209 },
  { month: "June", users: 214 },
]

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export default async function AdminDashboardPage() {
    const users = await getUsers();
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">all registered users</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{premiumUsers}</div>
                <p className="text-xs text-muted-foreground">{((premiumUsers/totalUsers)*100).toFixed(1)}% of total users</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Inboxes</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+1,234</div>
                <p className="text-xs text-muted-foreground">active in the last hour</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">$4,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New User Signups</CardTitle>
             <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                     <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                     <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Inbox Activity</CardTitle>
            <CardDescription>
              A log of the most recently created temporary inboxes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InboxLogsTable />
          </CardContent>
        </Card>
      </div>
  )
}
