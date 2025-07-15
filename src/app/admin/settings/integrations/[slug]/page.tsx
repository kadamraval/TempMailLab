
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input id="api-key" placeholder="Enter your API key" />
                        <p className="text-sm text-muted-foreground">
                            Enter the API key provided by the service.
                        </p>
                    </div>
                    <Separator />
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-integration" className="text-base">Enable Integration</Label>
                            <p className="text-sm text-muted-foreground">
                                Turn this integration on or off for your application.
                            </p>
                        </div>
                        <Switch id="enable-integration" />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save Changes</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
