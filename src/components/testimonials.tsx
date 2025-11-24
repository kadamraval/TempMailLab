
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote: "This is a game-changer for signing up for new services without worrying about spam. Super simple and effective.",
    name: "Alex Johnson",
    title: "Developer",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    quote: "As a QA tester, I generate dozens of test accounts daily. The API and custom domain features have saved me countless hours.",
    name: "Sarah Miller",
    title: "QA Engineer",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    quote: "Finally, a temporary email service that looks and feels professional. The interface is clean, and it just works.",
    name: "Michael Chen",
    title: "UX Designer",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    quote: "I love the peace of mind. I can download free resources or join newsletters without flooding my personal email.",
    name: "Emily Rodriguez",
    title: "Marketing Manager",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    quote: "The Pro plan is worth every penny. The team access and developer API are essential for our workflow.",
    name: "David Lee",
    title: "CTO, Tech Startup",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
];


export function Testimonials() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  return (
    <section id="testimonials" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">What Our Users Say</h2>
        </div>
        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-3xl mx-auto"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <div className="flex flex-col items-center text-center p-6 space-y-6">
                      <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </div>
                      </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
