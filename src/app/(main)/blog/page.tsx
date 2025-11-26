"use client";

import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";

const pageId = "blog-page";

export default function BlogPage() {
    return (
        <div>
            <PageSection pageId={pageId} sectionId="top-title" order={0} />
            <PageSection pageId={pageId} sectionId="blog" order={1} />
                <div className="text-center my-12">
                <Button variant="outline">Load More Posts</Button>
            </div>
            <PageSection pageId={pageId} sectionId="faq" order={2} />
            <PageSection pageId={pageId} sectionId="newsletter" order={3} />
        </div>
    )
}
