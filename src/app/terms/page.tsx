import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
             <p>Last updated: July 20, 2024</p>
            <p>By accessing the website at TempInbox, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
            
            <h3>1. Use License</h3>
            <p>Permission is granted to temporarily use the materials on TempInbox's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
            
            <h3>2. Disclaimer</h3>
            <p>The materials on TempInbox's website are provided on an 'as is' basis. TempInbox makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            
            <h3>3. Limitations</h3>
            <p>In no event shall TempInbox or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TempInbox's website.</p>
            
            <h3>4. Prohibited Activities</h3>
            <p>You may not use this service for any illegal activities, including but not limited to sending spam, phishing, or engaging in fraudulent activities. We reserve the right to block access to our service if we detect malicious use.</p>

            <h3>5. Modifications</h3>
            <p>TempInbox may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
          </CardContent>
        </card>
      </main>
    </div>
  );
}
