
"use client";

import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";

const pageId = "blog-page";

export default function BlogPage() {
    return (
        <div className="py-16 sm:py-20">
             <div className="container mx-auto px-4">
                <PageSection pageId={pageId} sectionId="top-title" order={0} />
                <PageSection pageId={pageId} sectionId="blog" order={1} />
                 <div className="text-center mt-12">
                    <Button variant="outline">Load More Posts</Button>
                </div>
                <PageSection pageId={pageId} sectionId="faq" order={2} />
                <PageSection pageId={pageId} sectionId="newsletter" order={3} />
            </div>
        </div>
    )
}
