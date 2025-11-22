
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CreditCard,
  Mail,
  Shield,
  Users,
  MessageSquare,
  DollarSign,
  Cloud,
  Layers,
  Settings,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const integrations = [
  { slug: "firebase", title: "Firebase", description: "Core backend services.", icon: <img src="https://www.gstatic.com/mobilesdk/160503_mobilesdk/logo/2x/firebase_28.png" alt="Firebase" className="w-6 h-6"/>, isConfigured: true },
  { slug: "mailgun", title: "Mailgun", description: "Inbound email processing for custom domains.", icon: <Mail />, isConfigured: false },
  { slug: "inbound-new", title: "inbound.new", description: "Modern, developer-first email inbound service.", icon: <Mail />, isConfigured: false },
  { slug: "mail-tm", title: "Mail.tm", description: "Temporary email provider.", icon: <Mail />, isConfigured: true },
  { slug: "mailchimp", title: "MailChimp", description: "Email marketing service.", icon: <Users />, isConfigured: false },
  { slug: "google-analytics", title: "Google Analytics", description: "Website traffic analysis.", icon: <Activity />, isConfigured: true },
  { slug: "google-tag-manager", title: "Google Tag Manager", description: "Manage marketing tags.", icon: <Layers />, isConfigured: false },
  { slug: "google-login", title: "Google Login", description: "Enable Google sign-in.", icon: <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6"/>, isConfigured: true },
  { slug: "facebook-login", title: "Facebook Login", description: "Enable Facebook sign-in.", icon: <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="Facebook" className="w-6 h-6"/>, isConfigured: false },
  { slug: "stripe", title: "Stripe", description: "Payment processing.", icon: <CreditCard />, isConfigured: true },
  { slug: "paypal", title: "PayPal", description: "Online payment system.", icon: <img src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png" alt="PayPal" className="w-8 h-auto"/>, isConfigured: false },
  { slug: "razorpay", title: "Razorpay", description: "Indian payment gateway.", icon: <DollarSign />, isConfigured: false },
  { slug: "tawkto", title: "Tawk.to", description: "Live chat support.", icon: <MessageSquare />, isConfigured: false },
  { slug: "google-adsense", title: "Google AdSense", description: "Monetize with ads.", icon: <DollarSign />, isConfigured: false },
  { slug: "recaptcha", title: "reCAPTCHA", description: "Spam and abuse protection.", icon: <Shield />, isConfigured: true },
  { slug: "cloud-billing-api", title: "Cloud Billing API", description: "Manage Google Cloud billing.", icon: <Cloud />, isConfigured: true },
  { slug: "cloud-monitoring-api", title: "Cloud Monitoring API", description: "Monitor cloud resources.", icon: <Cloud />, isConfigured: true },
  { slug: "other", title: "Other", description: "Custom integrations.", icon: <MoreHorizontal />, isConfigured: false },
];

export default function IntegrationsPage() {
  const router = useRouter();

  const handleConfigureClick = (slug: string) => {
    router.push(`/admin/settings/integrations/${slug}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect and manage third-party services.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.slug}
            className="flex items-center justify-between space-x-4 p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-muted rounded-md">{integration.icon}</div>
              <div>
                <p className="text-sm font-medium leading-none">
                  {integration.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
             <div className="flex items-center gap-4">
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${integration.isConfigured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {integration.isConfigured ? 'Connected' : 'Not Connected'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigureClick(integration.slug)}
              >
                Configure <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
