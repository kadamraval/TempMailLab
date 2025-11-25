"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { testimonials as defaultContent } from "@/lib/content-data";

export function Testimonials() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  const firestore = useFirestore();
  const contentId = 'testimonials';
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', contentId);
  }, [firestore]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
    if (!isLoading && !content && !error && firestore) {
      const defaultData = { title: "What Our Users Say", description: "", items: defaultContent };
      setDoc(doc(firestore, 'page_content', contentId), defaultData).catch(console.error);
    }
  }, [isLoading, content, error, firestore]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const currentContent = content || { title: "What Our Users Say", items: defaultContent };

  if (!currentContent || !currentContent.items) {
    return null;
  }

  return (
    <section id="testimonials">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{currentContent.title || "What Our Users Say"}</h2>
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
            {currentContent.items.map((testimonial: any, index: number) => (
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
