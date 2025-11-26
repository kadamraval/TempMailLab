
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const allPossibleSections = [
    { id: "top-title", name: "Top Title" }, { id: "inbox", name: "Inbox" }, { id: "why", name: "Why" },
    { id: "features", name: "Features" }, { id: "exclusive-features", name: "Exclusive Features" },
    { id: "comparison", name: "Comparison" }, { id: "pricing", name: "Pricing" },
    { id: "pricing-comparison", name: "Price Comparison" }, { id: "blog", name: "Blog" },
    { id: "testimonials", name: "Testimonials" }, { id: "faq", name: "FAQ" },
    { id: "newsletter", name: "Newsletter" }, { id: "contact-form", name: "Contact Form" },
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
              availableSections.map(section => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`add-${section.id}`}
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => handleToggleSection(section.id)}
                  />
                  <label htmlFor={`add-${section.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {section.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">All available sections have been added to this page.</p>
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
