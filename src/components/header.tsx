import { Mail } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">TempInbox</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
