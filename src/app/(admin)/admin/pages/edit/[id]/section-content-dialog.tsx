
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";

interface SectionContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string } | null;
}

const FaqForm = () => {
    return (
        <div className="space-y-4">
             <div className="space-y-2 p-4 border rounded-md">
                <Label>Question 1</Label>
                <Input defaultValue="Why use a temporary email?" />
                <Label>Answer 1</Label>
                <Textarea defaultValue="It's perfect for any situation where you don't want to give out your real email." />
            </div>
             <div className="space-y-2 p-4 border rounded-md">
                <Label>Question 2</Label>
                <Input defaultValue="How long do inboxes last?" />
                <Label>Answer 2</Label>
                <Textarea defaultValue="For our free service, inboxes expire after 10 minutes." />
            </div>
        </div>
    )
}

const WhyForm = () => {
    return (
         <div className="space-y-4">
             <div className="space-y-2 p-4 border rounded-md">
                <Label>Title 1</Label>
                <Input defaultValue="Sign-Up Anonymously" />
                <Label>Description 1</Label>
                <Textarea defaultValue="Register for sites and apps without exposing your real email." />
            </div>
         </div>
    )
}

const renderFormForSection = (sectionId: string) => {
    switch (sectionId) {
        case 'faq':
            return <FaqForm />;
        case 'why':
            return <WhyForm />;
        // Add other cases here for other editable sections
        default:
            return <p className="text-muted-foreground">This section's content is not editable at the moment.</p>;
    }
}

export function SectionContentDialog({ isOpen, onClose, section }: SectionContentDialogProps) {
  
  if (!section) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Content for '{section.name}'</DialogTitle>
          <DialogDescription>
            Make changes to the content of this section. Your changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-6">
            {renderFormForSection(section.id)}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
