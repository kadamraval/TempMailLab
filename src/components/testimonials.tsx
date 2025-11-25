
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TestimonialsProps {
  content: {
    title: string;
    items: {
      quote: string;
      name: string;
      title: string;
      avatar: string;
    }[];
  }
}

export function Testimonials({ content }: TestimonialsProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  if (!content || !content.items) {
    return null;
  }

  return (
    <section id="testimonials">
      <div className="container mx-auto px-4">
        {content.title && (
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
            </div>
        )}
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
            {content.items.map((testimonial: any, index: number) => (
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

    