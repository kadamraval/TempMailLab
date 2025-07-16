
// @/app/admin/settings/integrations/[slug]/page.tsx
import { IntegrationSettingsForm } from "@/components/admin/integration-settings-form";

// Dummy data for demonstration. In a real app, you'd fetch this.
const integrationsList = [
    { slug: "firebase", title: "Firebase", description: "Core service for authentication and database.", isConfigured: true },
    { slug: "mail-tm", title: "Mail.tm", description: "API for generating temporary email addresses.", isConfigured: true },
    { slug: "mailchimp", title: "MailChimp", description: "Engage your audience with email marketing.", isConfigured: false },
    { slug: "google-analytics", title: "Google Analytics", description: "Track website traffic and user behavior.", isConfigured: true },
    { slug: "google-tag-manager", title: "Google Tag Manager", description: "Manage and deploy marketing tags.", isConfigured: false },
    { slug: "paypal", title: "PayPal", description: "Accept payments from customers worldwide.", isConfigured: false },
    { slug: "stripe", title: "Stripe", description: "A complete payment platform for online businesses.", isConfigured: true },
    { slug: "razorpay", title: "Razorpay", description: "Popular payment gateway for businesses in India.", isConfigured: false },
    { slug: "tawkto", title: "Tawk.to", description: "Add live chat to your website.", isConfigured: false },
    { slug: "google-adsense", title: "Google AdSense", description: "Monetize your website with ads.", isConfigured: true },
    { slug: "facebook-login", title: "Facebook Login", description: "Allow users to sign in with Facebook.", isConfigured: false },
    { slug: "google-login", title: "Google Login", description: "Enable sign-in with Google accounts.", isConfigured: true },
    { slug: "recaptcha", title: "reCAPTCHA", description: "Protect your site from spam and abuse.", isConfigured: false },
    { slug: "cloud-billing-api", title: "Cloud Billing API", description: "Programmatically manage billing.", isConfigured: false },
    { slug: "cloud-monitoring-api", title: "Cloud Monitoring API", description: "Monitor your cloud infrastructure.", isConfigured: false },
];


export default function IntegrationDetailPage({ params }: { params: { slug: string } }) {
    const integration = integrationsList.find(i => i.slug === params.slug);

    if (!integration) {
        return <div>Integration not found.</div>
    }

    return (
        <IntegrationSettingsForm integration={integration} />
    );
}

// Generate static paths for each integration
export async function generateStaticParams() {
    return integrationsList.map((integration) => ({
        slug: integration.slug,
    }));
}
