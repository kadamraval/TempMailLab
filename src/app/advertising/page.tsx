import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdvertisingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Advertise With Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Reach a large audience of tech-savvy, privacy-conscious users by advertising on TempInbox. Our platform is an excellent place to promote your products, services, or brand.</p>
            <h3 className="text-xl font-semibold pt-4">Why Advertise with TempInbox?</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Targeted Audience:</strong> Connect with users who are interested in technology, privacy, and online security.</li>
                <li><strong>High Visibility:</strong> Our clean, user-friendly interface ensures your ad gets noticed without being intrusive.</li>
                <li><strong>Flexible Options:</strong> We offer a variety of ad formats and placements to suit your campaign goals and budget.</li>
            </ul>
            <p className="pt-4">For more information on our advertising packages and to discuss opportunities, please get in touch with our marketing team.</p>
            <Button asChild>
                <Link href="/contact">Contact Us</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
