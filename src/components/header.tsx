import Link from "next/link";
import { Mail, LogIn, UserPlus } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">TempInbox</h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
