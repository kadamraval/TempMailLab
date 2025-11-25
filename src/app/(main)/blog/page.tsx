
"use client";

import { BlogSection } from "@/components/blog-section";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
    return (
        <div className="py-16 sm:py-20">
             <div className="container mx-auto px-4">
                <BlogSection />
                 <div className="text-center mt-12">
                    <Button variant="outline">Load More Posts</Button>
                </div>
            </div>
        </div>
    )
}
