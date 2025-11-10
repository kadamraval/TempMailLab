
"use client"

import { BentoGrid, BentoGridItem } from "@/components/bento-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "This is a game-changer for signing up for new services without worrying about spam. Super simple and effective.",
    name: "Alex Johnson",
    title: "Developer",
    avatar: "https://i.pravatar.cc/150?img=1",
    className: "md:col-span-2",
  },
  {
    quote: "As a QA tester, I generate dozens of test accounts daily. The API and custom domain features have saved me countless hours.",
    name: "Sarah Miller",
    title: "QA Engineer",
    avatar: "https://i.pravatar.cc/150?img=2",
    className: "md:col-span-1",
  },
  {
    quote: "Finally, a temporary email service that looks and feels professional. The interface is clean, and it just works.",
    name: "Michael Chen",
    title: "UX Designer",
    avatar: "https://i.pravatar.cc/150?img=3",
    className: "md:col-span-1",
  },
    {
        quote: "I love the peace of mind. I can download free resources or join newsletters without flooding my personal email.",
        name: "Emily Rodriguez",
        title: "Marketing Manager",
        avatar: "https://i.pravatar.cc/150?img=4",
        className: "md:col-span-2",
    }
];

const TestimonialHeader = ({ name, title, avatar }: { name: string; title: string; avatar: string; }) => (
    <div className="flex flex-col items-center text-center gap-2">
        <Avatar>
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
        </div>
    </div>
);

export function Testimonials() {
    return (
        <section id="testimonials" className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">What Our Users Say</h2>
                </div>
                 <BentoGrid className="md:grid-rows-2">
                    {testimonials.map((testimonial, i) => (
                        <BentoGridItem
                            key={i}
                            title={<TestimonialHeader name={testimonial.name} title={testimonial.title} avatar={testimonial.avatar} />}
                            description={`"${testimonial.quote}"`}
                            className={testimonial.className}
                        />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
}
