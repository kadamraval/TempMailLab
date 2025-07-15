
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

// This function can be expanded to fetch real data based on the slug
function getIntegrationDetails(slug: string) {
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
        title: `${title} Settings`,
        description: `Manage settings for the ${title} integration here.`,
    }
}


export default function IntegrationDetailPage({ params }: { params: { slug: string } }) {
    const { title, description } = getIntegrationDetails(params.slug);

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
                    <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Configuration options for this integration will be available here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
