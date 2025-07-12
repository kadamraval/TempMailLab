import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>About TempInbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Welcome to TempInbox, your premier solution for temporary, disposable email addresses. In an online world where privacy is paramount, we provide a secure and anonymous way to interact with web services without exposing your personal email to spam and unwanted marketing.</p>
            <p>Our mission is simple: to give you back control over your inbox. Whether you're signing up for a new service, testing an application, or just need a quick, one-time email, TempInbox is here to help. Our service is fast, free, and incredibly easy to use.</p>
            <p>We are a team of privacy advocates and software engineers dedicated to building tools that empower users. Thank you for choosing TempInbox to protect your digital identity.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
