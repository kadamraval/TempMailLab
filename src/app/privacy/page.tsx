import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StayConnected } from "@/components/stay-connected";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>Last updated: July 20, 2024</p>
            <p>Your privacy is important to us. It is Temp Mailer's policy to respect your privacy regarding any information we may collect from you across our website.</p>
            
            <h3>1. Information We Collect</h3>
            <p>For our free service, we do not require any personal information or registration. We do not log the IP addresses of our users. For premium services, we collect only the necessary information to process payment and provide the service, such as an email address for account management.</p>
            
            <h3>2. How We Use Information</h3>
            <p>Any information collected for premium services is used solely for the purpose of providing and improving our service. We do not sell, trade, or rent your personal identification information to others.</p>
            
            <h3>3. Data Retention</h3>
            <p>Emails sent to temporary addresses are stored for a limited time (as specified by the service, e.g., 10 minutes for the free tier) and then permanently deleted. We do not keep logs of email content.</p>

            <h3>4. Cookies</h3>
            <p>We use cookies to maintain your session and preferences. We do not use third-party tracking cookies for advertising purposes.</p>

            <h3>5. Changes to This Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
          </CardContent>
        </Card>
      </main>
      <StayConnected />
      <Footer />
    </div>
  );
}
