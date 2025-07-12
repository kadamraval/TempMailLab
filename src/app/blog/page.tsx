import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { StayConnected } from "@/components/stay-connected";

const blogPosts = [
    {
        title: "The Importance of Digital Privacy in 2024",
        description: "A deep dive into why protecting your online identity has never been more critical.",
        author: "Jane Doe",
        date: "July 15, 2024",
        image: "https://placehold.co/600x400.png",
        dataAiHint: "digital privacy",
    },
    {
        title: "Top 5 Use Cases for a Temporary Email Address",
        description: "From online shopping to signing up for newsletters, discover how TempInbox can simplify your life.",
        author: "John Smith",
        date: "July 10, 2024",
        image: "https://placehold.co/600x400.png",
        dataAiHint: "email security",
    },
     {
        title: "How We Keep Your Data Secure",
        description: "An inside look at our security practices and our commitment to your privacy.",
        author: "Alex Ray",
        date: "July 5, 2024",
        image: "https://placehold.co/600x400.png",
        dataAiHint: "data security",
    }
];


export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Our Blog</h1>
            <p className="text-muted-foreground mt-2">News, tips, and insights on digital privacy and productivity.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader>
                        <div className="aspect-video relative mb-4">
                            <Image src={post.image} alt={post.title} fill className="rounded-t-lg object-cover" data-ai-hint={post.dataAiHint} />
                        </div>
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>{post.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">By {post.author} on {post.date}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="link" className="p-0">
                            <Link href="#">Read More &rarr;</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </main>
      <StayConnected />
      <Footer />
    </div>
  );
}
