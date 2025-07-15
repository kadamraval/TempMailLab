
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { IntegrationSettingsForm } from "@/components/admin/integration-settings-form";

// This function can be expanded to fetch real data based on the slug
function getIntegrationDetails(slug: string) {
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
        slug: slug,
        title: `${title}`,
        description: `Manage settings for the ${title} integration here.`,
        // In a real app, you'd fetch this from a database or env file
        isConfigured: ['firebase', 'google-analytics', 'stripe', 'google-adsense', 'google-login', 'mail-tm'].includes(slug),
    }
}


export default function IntegrationDetailPage({ params }: { params: { slug: string } }) {
    const integration = getIntegrationDetails(params.slug);

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                    <Link href="/admin/settings/integrations">Integrations</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{integration.title}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <IntegrationSettingsForm integration={integration} />
        </div>
    )
}
