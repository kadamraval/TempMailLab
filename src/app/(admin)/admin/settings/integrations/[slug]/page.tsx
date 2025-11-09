"use client"

import { IntegrationSettingsForm } from "@/components/admin/integration-settings-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { notFound } from 'next/navigation';
import { use } from 'react';

interface IntegrationPageProps {
  params: {
    slug: string;
  };
}

const integrationsData: { [key: string]: any } = {
  firebase: { title: "Firebase", description: "Manage your core Firebase backend services configuration." },
  mailgun: { title: "Mailgun", description: "Configure Mailgun for inbound email processing.", fields: ['apiKey', 'domain'] },
  "mail-tm": { title: "Mail.tm", description: "Configure the temporary email provider API." },
  mailchimp: { title: "MailChimp", description: "Connect your MailChimp account for email marketing." },
  "google-analytics": { title: "Google Analytics", description: "Set up website traffic analysis." },
  "google-tag-manager": { title: "Google Tag Manager", description: "Manage your marketing tags and tracking scripts." },
  "google-login": { title: "Google Login", description: "Configure Google Sign-In for your users." },
  "facebook-login": { title: "Facebook Login", description: "Configure Facebook Sign-In for your users." },
  stripe: { title: "Stripe", description: "Manage your Stripe integration for payment processing." },
  paypal: { title: "PayPal", description: "Connect your PayPal account for online payments." },
  razorpay: { title: "Razorpay", description: "Set up the Razorpay payment gateway." },
  tawkto: { title: "Tawk.to", description: "Manage your Tawk.to live chat integration." },
  "google-adsense": { title: "Google AdSense", description: "Configure Google AdSense to monetize your site." },
  recaptcha: { title: "reCAPTCHA", description: "Set up reCAPTCHA to protect against spam." },
  "cloud-billing-api": { title: "Cloud Billing API", description: "Manage your Google Cloud billing integration." },
  "cloud-monitoring-api": { title: "Cloud Monitoring API", description: "Configure your Google Cloud Monitoring integration." },
  other: { title: "Other Integration", description: "Manage your custom integration settings." },
};


export default function IntegrationPage({ params }: IntegrationPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const integration = integrationsData[slug];

  if (!integration) {
    notFound();
  }

  return (
    <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                <BreadcrumbLink href="/admin/settings">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbLink href="/admin/settings/integrations">Integrations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{integration.title}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <IntegrationSettingsForm
            integration={{
                slug: slug,
                title: integration.title,
                description: integration.description,
                isConfigured: slug === 'firebase' || slug === 'mail-tm', // Example logic
                fields: integration.fields
            }}
        />
    </div>
  );
}
