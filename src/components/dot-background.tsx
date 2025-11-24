
import React from "react";
import { cn } from "@/lib/utils";

export function DotBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className={cn("w-full h-full dark:bg-black bg-white dark:bg-dot-white/[0.2] bg-dot-black/[0.2] absolute top-0 left-0")}>
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      {children}
    </div>
  );
}
