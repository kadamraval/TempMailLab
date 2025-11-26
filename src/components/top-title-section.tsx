
"use client";

import { Badge } from "./ui/badge";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface TopTitleSectionProps {
  content: {
    title: string;
    description: string;
    badge?: {
      text: string;
      icon: string;
      show: boolean;
    }
  }
}

export function TopTitleSection({ content }: TopTitleSectionProps) {
  if (!content) return null;

  const BadgeIcon = content.badge?.icon ? (LucideIcons as any)[content.badge.icon] : null;

  return (
    <section id="top-title" className="py-16 sm:py-20">
      <div className="relative w-full max-w-4xl mx-auto text-center px-4">
          {content.badge?.show && (
            <Badge variant="outline" className="mb-4 text-sm">
                {BadgeIcon && <BadgeIcon className="mr-2 h-4 w-4" />}
                {content.badge.text}
            </Badge>
          )}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
              {content.title}
          </h1>
          <p className={cn("text-lg text-muted-foreground mt-4 max-w-2xl mx-auto", !content.description && "hidden")}>{content.description}</p>
      </div>
    </section>
  )
}
