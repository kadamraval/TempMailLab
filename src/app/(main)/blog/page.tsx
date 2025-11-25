
"use client";

import { BlogSection } from "@/components/blog-section";

export default function BlogPage() {
    return (
        <>
            <div className="py-16 sm:py-20 text-center">
                <div className="container mx-auto px-4">
                    <div className="relative w-full max-w-4xl mx-auto text-center mb-12">
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Blog
                        </h1>
                        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">News, updates, and privacy tips from the Tempmailoz team.</p>
                    </div>
                </div>
            </div>
            <BlogSection />
        </>
    )
}
