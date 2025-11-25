"use client";

import * as LucideIcons from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import imageData from '@/app/lib/placeholder-images.json';
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { exclusiveFeatures as defaultContent } from "@/lib/content-data";


export const ExclusiveFeatures = ({ removeBorder }: { removeBorder?: boolean }) => {
  const firestore = useFirestore();
  const contentId = 'exclusive-features';
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'page_content', contentId);
  }, [firestore]);

  const { data: content, isLoading, error } = useDoc(contentRef);
  
  useEffect(() => {
    if (!isLoading && !content && !error && firestore) {
      const defaultData = { title: "Exclusive Features", description: "Unlock premium features for the ultimate temporary email experience.", items: defaultContent };
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

  const currentContent = content || { title: "Exclusive Features", items: defaultContent };

  if (!currentContent || !currentContent.items) {
    return null; // Or some placeholder
  }

  return (
    <section id="exclusive-features">
         <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    {currentContent.title || "Exclusive Features"}
                </h2>
            </div>
            
            <div className="space-y-8">
              {currentContent.items.map((feature: any, index: number) => {
                const Icon = (LucideIcons as any)[feature.iconName] || LucideIcons.HelpCircle;
                // Match image data from placeholder JSON
                const image = imageData.exclusiveFeatures[index] || imageData.exclusiveFeatures[0];
                return (
                    <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className={cn(
                        "relative flex flex-col md:flex-row items-center gap-8 p-6 rounded-lg bg-card",
                        !removeBorder && "border"
                    )}
                    >
                        <div className="w-full md:w-1/2">
                            <Image 
                                src={image.src}
                                alt={image.alt}
                                width={image.width}
                                height={image.height}
                                className="rounded-md object-cover w-full aspect-video"
                                data-ai-hint={image.dataAiHint}
                            />
                        </div>
                        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <div className="bg-primary text-primary-foreground p-3 rounded-full">
                                    <Icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )
              })}
            </div>

         </div>
    </section>
  );
};
