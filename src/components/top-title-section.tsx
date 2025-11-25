
"use client";

interface TopTitleSectionProps {
  content: {
    title: string;
    description: string;
  }
}

export function TopTitleSection({ content }: TopTitleSectionProps) {
  if (!content) return null;

  return (
    <section id="top-title">
      <div className="relative w-full max-w-4xl mx-auto text-center px-4">
          <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
              {content.title}
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">{content.description}</p>
      </div>
    </section>
  )
}
