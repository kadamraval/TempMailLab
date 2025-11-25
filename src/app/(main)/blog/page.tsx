
"use client";

import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";

const pageId = "blog-page";

export default function BlogPage() {
    return (
        <div className="py-16 sm:py-20">
             <div className="container mx-auto px-4">
                <PageSection pageId={pageId} sectionId="blog" order={0} />
                 <div className="text-center mt-12">
                    <Button variant="outline">Load More Posts</Button>
                </div>
            </div>
        </div>
    )
}

    