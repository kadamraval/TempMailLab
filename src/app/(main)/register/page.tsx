import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Temp Mailer</h1>
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full name</Label>
                <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="full-name" placeholder="John Doe" required className="pl-8" />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
               <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" className="pl-8" />
              </div>
            </div>
            <Button asChild type="submit" className="w-full">
              <Link href="/client/dashboard">Create an account</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
