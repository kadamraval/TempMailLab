import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">TempInbox</h1>
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  defaultValue="admin@example.com"
                  required
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
               <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" defaultValue="password" required className="pl-8" />
              </div>
            </div>
            <Button asChild type="submit" className="w-full">
              <Link href="/admin/dashboard">Login</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
                <strong>Demo Credentials:</strong><br/>
                Email: admin@example.com | Password: password
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
