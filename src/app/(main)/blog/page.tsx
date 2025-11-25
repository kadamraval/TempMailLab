"use client";

import { BlogSection } from "@/components/blog-section";

export default function BlogPage() {
    return (
        <>
            <div className="py-16 sm:py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Blog
                </h1>
                <p className="text-lg text-muted-foreground mt-4">News, updates, and privacy tips from the Tempmailoz team.</p>
            </div>
            <BlogSection />
        </>
    )
}
