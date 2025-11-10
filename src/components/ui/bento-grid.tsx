
"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className={cn(
            "row-span-1 rounded-3xl group/bento transition duration-200 p-4 bg-background border justify-between flex flex-col space-y-4",
            className
        )}
        >
        <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl flex items-center justify-center">
            {header}
        </div>
        <div className="group-hover/bento:translate-x-2 transition duration-200">
            {icon}
            <div className="font-sans font-bold text-foreground mb-2 mt-2">
                {title}
            </div>
            <div className="font-sans font-normal text-muted-foreground text-xs">
                {description}
            </div>
        </div>
    </motion.div>
  );
};
