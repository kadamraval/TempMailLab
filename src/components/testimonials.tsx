
"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
    {
        quote: "This is a game-changer for signing up for new services without worrying about spam. Super simple and effective.",
        name: "Alex Johnson",
        title: "Developer",
        avatar: "https://i.pravatar.cc/150?img=1"
    },
    {
        quote: "As a QA tester, I generate dozens of test accounts daily. The API and custom domain features have saved me countless hours.",
        name: "Sarah Miller",
        title: "QA Engineer",
        avatar: "https://i.pravatar.cc/150?img=2"

    },
    {
        quote: "Finally, a temporary email service that looks and feels professional. The interface is clean, and it just works.",
        name: "Michael Chen",
        title: "UX Designer",
        avatar: "https://i.pravatar.cc/150?img=3"
    },
    {
        quote: "I love the peace of mind. I can download free resources or join newsletters without flooding my personal email.",
        name: "Emily Rodriguez",
        title: "Marketing Manager",
        avatar: "https://i.pravatar.cc/150?img=4"
    }
]

export function Testimonials() {
    return (
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">What Our Users Say</h2>
                </div>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full max-w-4xl mx-auto"
                >
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="md:basis-1/2">
                                <div className="p-4">
                                <Card className="border">
                                    <CardContent className="flex flex-col items-center justify-center p-8 gap-6 text-center">
                                        <p className="text-lg text-muted-foreground">"{testimonial.quote}"</p>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{testimonial.name}</p>
                                                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </section>
    )
}
