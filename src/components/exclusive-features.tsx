
"use client";

import * as LucideIcons from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import imageData from '@/app/lib/placeholder-images.json';

interface ExclusiveFeaturesProps {
  content: {
    title: string;
    description: string;
    items: {
      iconName: string;
      title: string;
      description: string;
    }[];
  }
}

export const ExclusiveFeatures = ({ content }: ExclusiveFeaturesProps) => {

  if (!content || !content.items) {
    return null;
  }

  return (
    <section id="exclusive-features">
       {content.title && (
         <div className="text-center space-y-4 mb-12">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                 {content.title}
             </h2>
             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
         </div>
       )}
       
       <div className="space-y-8">
         {content.items.map((feature: any, index: number) => {
           const Icon = (LucideIcons as any)[feature.iconName] || LucideIcons.HelpCircle;
           const image = imageData.exclusiveFeatures[index] || imageData.exclusiveFeatures[0];
           return (
               <motion.div
               key={feature.title}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: index * 0.2 }}
               viewport={{ once: true }}
               className="relative flex flex-col md:flex-row items-center gap-8 p-6 rounded-lg bg-card border"
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
    </section>
  );
};
