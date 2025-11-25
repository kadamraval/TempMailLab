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
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const integrationsList = [
  { slug: "firebase", title: "Firebase", description: "Core backend services.", icon: <img src="https://www.gstatic.com/mobilesdk/160503_mobilesdk/logo/2x/firebase_28.png" alt="Firebase" className="w-6 h-6"/>, isConfigured: true },
  { slug: "inbound-new", title: "inbound.new", description: "Modern, developer-first email inbound service.", icon: <Mail />, isConfigured: true },
  { slug: "google-analytics", title: "Google Analytics", description: "Website traffic analysis.", icon: <Activity />, isConfigured: true },
  { slug: "google-adsense", title: "Google AdSense", description: "Monetize with ads.", icon: <DollarSign />, isConfigured: true },
  { slug: "google-login", title: "Google Login", description: "Enable Google sign-in.", icon: <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6"/>, isConfigured: true },
  { slug: "recaptcha", title: "reCAPTCHA", description: "Spam and abuse protection.", icon: <Shield />, isConfigured: true },
  { slug: "stripe", title: "Stripe", description: "Payment processing.", icon: <CreditCard />, isConfigured: false },
  { slug: "mailchimp", title: "MailChimp", description: "Email marketing service.", icon: <Users />, isConfigured: false },
  { slug: "google-tag-manager", title: "Google Tag Manager", description: "Manage marketing tags.", icon: <Layers />, isConfigured: false },
  { slug: "facebook-login", title: "Facebook Login", description: "Enable Facebook sign-in.", icon: <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="Facebook" className="w-6 h-6"/>, isConfigured: false },
  { slug: "paypal", title: "PayPal", description: "Online payment system.", icon: <img src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png" alt="PayPal" className="w-8 h-auto"/>, isConfigured: false },
  { slug: "razorpay", title: "Razorpay", description: "Indian payment gateway.", icon: <DollarSign />, isConfigured: false },
  { slug: "tawkto", title: "Tawk.to", description: "Live chat support.", icon: <MessageSquare />, isConfigured: false },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const handleConfigureClick = (slug: string) => {
    router.push(`/admin/settings/integrations/${slug}`);
  };

  const filteredIntegrations = integrationsList.filter(int => {
    if (filter === 'all') return true;
    if (filter === 'connected') return int.isConfigured;
    if (filter === 'not_connected') return !int.isConfigured;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                Connect and manage third-party services.
                </CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filter === 'all'} onCheckedChange={() => setFilter('all')}>All</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filter === 'connected'} onCheckedChange={() => setFilter('connected')}>Connected</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filter === 'not_connected'} onCheckedChange={() => setFilter('not_connected')}>Not Connected</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {filteredIntegrations.map((integration) => (
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
              <div className={cn('text-xs font-semibold px-2 py-1 rounded-full', 
                  integration.isConfigured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              )}>
                {integration.isConfigured ? 'Connected' : 'Coming Soon'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigureClick(integration.slug)}
                disabled={!integration.isConfigured}
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
