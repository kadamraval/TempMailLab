import { Header } from "@/components/header";
import { TempInboxClient } from "@/components/temp-inbox-client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <TempInboxClient />
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} TempInbox. All rights reserved.</p>
        <p className="mt-2">
          <Link href="/login/admin" className="underline">
            Admin Login (Temporary)
          </Link>
        </p>
      </footer>
    </div>
  );
}
