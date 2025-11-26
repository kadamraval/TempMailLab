"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as LucideIcons from "lucide-react";
import { cn } from '@/lib/utils';

const allPossibleSections = [
    { id: "top-title", name: "Top Title", icon: "AlignHorizontalJustifyStart" }, 
    { id: "inbox", name: "Inbox", icon: "Inbox" }, 
    { id: "why", name: "Why Us Section", icon: "HelpCircle" },
    { id: "features", name: "Features Grid", icon: "LayoutGrid" }, 
    { id: "exclusive-features", name: "Exclusive Features", icon: "Star" },
    { id: "comparison", name: "Comparison Table", icon: "Table" }, 
    { id: "pricing", name: "Pricing Plans", icon: "CreditCard" },
    { id: "pricing-comparison", name: "Price Comparison", icon: "Columns" }, 
    { id: "blog", name: "Blog Posts", icon: "Newspaper" },
    { id: "testimonials", name: "Testimonials", icon: "MessageSquare" }, 
    { id: "faq", name: "FAQ", icon: "MessageCircleQuestion" },
    { id: "newsletter", name: "Newsletter", icon: "Mail" }, 
    { id: "contact-form", name: "Contact Form", icon: "Send" },
];

interface AddSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingSectionIds: string[];
  onAddSections: (sections: any[]) => void;
}

export function AddSectionDialog({ isOpen, onClose, existingSectionIds, onAddSections }: AddSectionDialogProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleAddClick = () => {
    const sectionsToAdd = allPossibleSections.filter(s => selectedSections.includes(s.id));
    onAddSections(sectionsToAdd);
    setSelectedSections([]);
    onClose();
  };

  const availableSections = allPossibleSections.filter(s => !existingSectionIds.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sections to Page</DialogTitle>
          <DialogDescription>Select the sections you want to add to this page.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-2 p-4">
            {availableSections.length > 0 ? (
              availableSections.map(section => {
                  const Icon = (LucideIcons as any)[section.icon] || LucideIcons.HelpCircle;
                  const isSelected = selectedSections.includes(section.id);
                  return (
                    <div 
                        key={section.id} 
                        onClick={() => handleToggleSection(section.id)}
                        className={cn("flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors", 
                            isSelected ? "bg-muted border-primary" : "hover:bg-muted/50"
                        )}
                    >
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium leading-none">
                        {section.name}
                      </span>
                    </div>
                  )
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">All available sections have been added to this page.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddClick} disabled={selectedSections.length === 0}>Add Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
