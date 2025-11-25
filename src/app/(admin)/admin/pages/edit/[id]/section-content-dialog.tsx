"use client";

import * as React from 'react';
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
import { PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCases, features, faqs, comparisonFeatures, testimonials, exclusiveFeatures } from "@/lib/content-data";
import { IconPicker } from '@/components/icon-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SectionContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string, isDynamic?: boolean } | null;
}

const TopContentFields = ({ title, description }: { title: string, description: string }) => (
    <div className="space-y-4">
        <div>
            <Label>Section Title</Label>
            <Input defaultValue={title} />
        </div>
        <div>
            <Label>Section Description</Label>
            <Textarea defaultValue={description} />
        </div>
        <Separator />
    </div>
);

const WhyForm = () => {
    const [items, setItems] = React.useState(useCases);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    return (
        <div className="space-y-4">
            <TopContentFields title="Why Temp Mail?" description="" />
            {items.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Item {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Icon Name (from lucide-react)</Label>
                    <IconPicker value={item.iconName} onChange={(val) => handleItemChange(index, 'iconName', val)} />
                    <Label>Title</Label>
                    <Input value={item.title} onChange={(e) => handleItemChange(index, 'title', e.target.value)} />
                    <Label>Description</Label>
                    <Textarea value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                </div>
            ))}
             <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const FeaturesForm = () => {
     const [items, setItems] = React.useState(features);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };
     return (
        <div className="space-y-4">
            <TopContentFields title="Features" description="" />
             {items.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Item {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Icon Name (from lucide-react)</Label>
                    <IconPicker value={item.iconName} onChange={(val) => handleItemChange(index, 'iconName', val)} />
                    <Label>Title</Label>
                    <Input value={item.title} onChange={(e) => handleItemChange(index, 'title', e.target.value)} />
                    <Label>Description</Label>
                    <Textarea value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                </div>
            ))}
             <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const ExclusiveFeaturesForm = () => {
     return (
        <div className="space-y-4">
            <TopContentFields title="Exclusive Features" description="" />
             {exclusiveFeatures.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Item {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Icon Name (from lucide-react)</Label>
                    <Input defaultValue={item.iconName} />
                    <Label>Title</Label>
                    <Input defaultValue={item.title} />
                    <Label>Description</Label>
                    <Textarea defaultValue={item.description} />
                    <Label>Image URL</Label>
                    <Input defaultValue={item.image.src} />
                </div>
            ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const ComparisonForm = () => {
    return (
        <div className="space-y-4">
             <TopContentFields title="Tempmailoz Vs Others" description="" />
             {comparisonFeatures.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Feature {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Feature Name</Label>
                    <Input defaultValue={item.feature} />
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Label>Our App:</Label>
                            <Switch defaultChecked={item.tempmailoz} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label>Others:</Label>
                            <Switch defaultChecked={item.others} />
                        </div>
                    </div>
                </div>
             ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Row</Button>
        </div>
    )
}


const FaqForm = () => {
    return (
        <div className="space-y-4">
             <TopContentFields title="Questions?" description="" />
             {faqs.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Question {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Question</Label>
                    <Input defaultValue={item.question} />
                    <Label>Answer</Label>
                    <Textarea defaultValue={item.answer} rows={4} />
                </div>
             ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add FAQ</Button>
        </div>
    )
}

const TestimonialsForm = () => {
    return (
        <div className="space-y-4">
            <TopContentFields title="What Our Users Say" description="" />
            {testimonials.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Testimonial {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Avatar URL</Label>
                    <Input defaultValue={item.avatar} />
                    <Label>Name</Label>
                    <Input defaultValue={item.name} />
                    <Label>Title</Label>
                    <Input defaultValue={item.title} />
                    <Label>Quote</Label>
                    <Textarea defaultValue={item.quote} />
                </div>
            ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Testimonial</Button>
        </div>
    )
}

const DynamicSectionForm = ({ section }: { section: { id: string; name: string, isDynamic?: boolean } }) => {
    const titles: Record<string, string> = {
        'pricing': 'Pricing',
        'blog': 'From the Blog',
        'newsletter': 'Stay Connected',
        'contact-form': 'Send us a Message',
    }
     const descriptions: Record<string, string> = {
        'pricing': '',
        'blog': '',
        'newsletter': 'Subscribe to our newsletter for product updates and privacy news.',
        'contact-form': 'Fill out the form below and we\'ll get back to you as soon as possible.',
    }
    return (
        <div className="space-y-4">
             <TopContentFields title={titles[section.id] || section.name} description={descriptions[section.id] || ''} />
             <p className="text-muted-foreground text-center py-8">The core content of this section is managed automatically and cannot be edited here.</p>
        </div>
    )
}



const renderFormForSection = (section: { id: string; name: string, isDynamic?: boolean }) => {
    if (section.isDynamic) {
        return <DynamicSectionForm section={section} />;
    }

    switch (section.id) {
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
        
        <ScrollArea className="max-h-[60vh]">
            <div className="py-4 pr-6 space-y-6">
                {renderFormForSection(section)}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Content</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
