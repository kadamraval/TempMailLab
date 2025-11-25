
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
import { PlusCircle, Trash2, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface SectionContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string } | null;
}

const TopContentFields = () => (
    <div className="space-y-4">
        <div>
            <Label>Top Title</Label>
            <Input placeholder="Section Title (e.g., Why Temp Mail?)" />
        </div>
        <div>
            <Label>Top Description</Label>
            <Textarea placeholder="A short description for the section header." />
        </div>
        <Separator />
    </div>
);

const WhyForm = () => {
    return (
        <div className="space-y-4">
            <TopContentFields />
            <div className="space-y-2 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                    <Label>Item 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Icon (e.g., ShieldCheck)</Label>
                <Input defaultValue="ShieldCheck" />
                <Label>Title</Label>
                <Input defaultValue="Sign-Up Anonymously" />
                <Label>Description</Label>
                <Textarea defaultValue="Register for sites and apps without exposing your real email." />
            </div>
             <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const FeaturesForm = () => {
     return (
        <div className="space-y-4">
            <TopContentFields />
            <div className="space-y-2 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                    <Label>Item 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Icon (e.g., Zap)</Label>
                <Input defaultValue="Zap" />
                <Label>Title</Label>
                <Input defaultValue="Instant Setup" />
                <Label>Description</Label>
                <Textarea defaultValue="Generate a new email address with a single click. No registration required." />
            </div>
             <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const ExclusiveFeaturesForm = () => {
     return (
        <div className="space-y-4">
            <TopContentFields />
            <div className="space-y-2 p-4 border rounded-md">
                 <div className="flex justify-between items-center">
                    <Label>Item 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Image URL</Label>
                <Input defaultValue="https://images.unsplash.com/..." />
                <Label>Title</Label>
                <Input defaultValue="Password Protection" />
                <Label>Description</Label>
                <Textarea defaultValue="Secure your temporary inboxes with a unique password." />
            </div>
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const ComparisonForm = () => {
    return (
        <div className="space-y-4">
             <TopContentFields />
             <div className="space-y-2 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                    <Label>Feature 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Feature Name</Label>
                <Input defaultValue="Instant Address Generation" />
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Label>Our App:</Label>
                        <Switch defaultChecked={true} />
                    </div>
                     <div className="flex items-center gap-2">
                        <Label>Others:</Label>
                        <Switch defaultChecked={true} />
                    </div>
                </div>
            </div>
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Row</Button>
        </div>
    )
}


const FaqForm = () => {
    return (
        <div className="space-y-4">
             <TopContentFields />
             <div className="space-y-2 p-4 border rounded-md">
                 <div className="flex justify-between items-center">
                    <Label>Question 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Question</Label>
                <Input defaultValue="Why use a temporary email?" />
                <Label>Answer</Label>
                <Textarea defaultValue="It's perfect for any situation where you don't want to give out your real email." />
            </div>
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add FAQ</Button>
        </div>
    )
}

const TestimonialsForm = () => {
    return (
        <div className="space-y-4">
            <TopContentFields />
            <div className="space-y-2 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                    <Label>Testimonial 1</Label>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Label>Avatar URL</Label>
                <Input defaultValue="https://i.pravatar.cc/150?img=1" />
                <Label>Name</Label>
                <Input defaultValue="Alex Johnson" />
                <Label>Title</Label>
                <Input defaultValue="Developer" />
                <Label>Quote</Label>
                <Textarea defaultValue="This is a game-changer for signing up for new services without worrying about spam." />
            </div>
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Testimonial</Button>
        </div>
    )
}

const NewsletterForm = () => {
    return (
        <div className="space-y-4 p-4 border rounded-md">
            <Label>Title</Label>
            <Input defaultValue="Stay Connected" />
            <Label>Description</Label>
            <Textarea defaultValue="Subscribe to our newsletter for product updates and privacy news." />
        </div>
    )
}



const renderFormForSection = (sectionId: string) => {
    switch (sectionId) {
        case 'why':
            return <WhyForm />;
        case 'features':
            return <FeaturesForm />;
        case 'exclusive-features':
            return <ExclusiveFeaturesForm />;
        case 'comparison':
            return <ComparisonForm />;
        case 'testimonials':
            return <TestimonialsForm />;
        case 'faq':
            return <FaqForm />;
        case 'newsletter':
            return <NewsletterForm />;
        // Dynamic sections have no editable content here
        case 'inbox':
        case 'pricing':
        case 'pricing-comparison':
        case 'blog':
        case 'contact-form':
        case 'knowledgebase':
            return <p className="text-muted-foreground text-center py-8">This section's content is managed automatically and cannot be edited here.</p>;
        default:
            return <p className="text-muted-foreground text-center py-8">This section is not configured for content editing.</p>;
    }
}

export function SectionContentDialog({ isOpen, onClose, section }: SectionContentDialogProps) {
  
  if (!section) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Content for '{section.name}'</DialogTitle>
          <DialogDescription>
            Make changes to the content of this section. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-6">
            {renderFormForSection(section.id)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Content</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
