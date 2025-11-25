
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
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCases, features, faqs, comparisonFeatures, testimonials, exclusiveFeatures } from "@/lib/content-data";
import { IconPicker } from '@/components/icon-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveContentAction } from '@/lib/actions/content';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface SectionContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string, isDynamic?: boolean } | null;
}

const TopContentFields = ({ title, description, onTitleChange, onDescriptionChange }: { title: string, description: string, onTitleChange: (val: string) => void, onDescriptionChange: (val: string) => void }) => (
    <div className="space-y-4">
        <div>
            <Label>Section Title</Label>
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </div>
        <div>
            <Label>Section Description</Label>
            <Textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
        </div>
        <Separator />
    </div>
);

const WhyForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [content, setContent] = React.useState(useCases);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };

    React.useEffect(() => { onSave(content) }, [content, onSave]);

    return (
        <div className="space-y-4">
            <TopContentFields title="Why Temp Mail?" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
            {content.map((item, index) => (
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

const FeaturesForm = ({ onSave }: { onSave: (data: any) => void }) => {
     const [content, setContent] = React.useState(features);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };

    React.useEffect(() => { onSave(content) }, [content, onSave]);

     return (
        <div className="space-y-4">
            <TopContentFields title="Features" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
             {content.map((item, index) => (
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

const ExclusiveFeaturesForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [content, setContent] = React.useState(exclusiveFeatures);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };
    
    React.useEffect(() => { onSave(content) }, [content, onSave]);

     return (
        <div className="space-y-4">
            <TopContentFields title="Exclusive Features" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
             {content.map((item, index) => (
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
                    <Label>Image URL</Label>
                    <Input value={item.image.src} onChange={(e) => handleItemChange(index, 'image', {...item.image, src: e.target.value})} />
                </div>
            ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const ComparisonForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [content, setContent] = React.useState(comparisonFeatures);
    
    const handleItemChange = (index: number, field: string, value: string | boolean) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };

    React.useEffect(() => { onSave(content) }, [content, onSave]);

    return (
        <div className="space-y-4">
             <TopContentFields title="Tempmailoz Vs Others" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
             {content.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Feature {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Feature Name</Label>
                    <Input value={item.feature} onChange={(e) => handleItemChange(index, 'feature', e.target.value)} />
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Label>Our App:</Label>
                            <Switch checked={item.tempmailoz} onCheckedChange={(val) => handleItemChange(index, 'tempmailoz', val)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label>Others:</Label>
                            <Switch checked={item.others} onCheckedChange={(val) => handleItemChange(index, 'others', val)} />
                        </div>
                    </div>
                </div>
             ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add Row</Button>
        </div>
    )
}


const FaqForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [content, setContent] = React.useState(faqs);
    
    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };

    React.useEffect(() => { onSave(content) }, [content, onSave]);

    return (
        <div className="space-y-4">
             <TopContentFields title="Questions?" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
             {content.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Question {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Question</Label>
                    <Input value={item.question} onChange={(e) => handleItemChange(index, 'question', e.target.value)} />
                    <Label>Answer</Label>
                    <Textarea value={item.answer} onChange={(e) => handleItemChange(index, 'answer', e.target.value)} rows={4} />
                </div>
             ))}
            <Button variant="outline" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add FAQ</Button>
        </div>
    )
}

const TestimonialsForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [content, setContent] = React.useState(testimonials);

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content];
        (newItems[index] as any)[field] = value;
        setContent(newItems);
    };
    
    React.useEffect(() => { onSave(content) }, [content, onSave]);

    return (
        <div className="space-y-4">
            <TopContentFields title="What Our Users Say" description="" onTitleChange={() => {}} onDescriptionChange={() => {}} />
            {content.map((item, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Testimonial {index + 1}</Label>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Avatar URL</Label>
                    <Input value={item.avatar} onChange={(e) => handleItemChange(index, 'avatar', e.target.value)} />
                    <Label>Name</Label>
                    <Input value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} />
                    <Label>Title</Label>
                    <Input value={item.title} onChange={(e) => handleItemChange(index, 'title', e.target.value)} />
                    <Label>Quote</Label>
                    <Textarea value={item.quote} onChange={(e) => handleItemChange(index, 'quote', e.target.value)} />
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
             <TopContentFields title={titles[section.id] || section.name} description={descriptions[section.id] || ''} onTitleChange={() => {}} onDescriptionChange={() => {}}/>
             <p className="text-muted-foreground text-center py-8">The core content of this section is managed automatically and cannot be edited here.</p>
        </div>
    )
}



export function SectionContentDialog({ isOpen, onClose, section }: SectionContentDialogProps) {
  const [contentData, setContentData] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
      if (!section || !contentData) return;
      setIsSaving(true);
      const result = await saveContentAction(section.id, contentData);

      if (result.success) {
          toast({
              title: "Content Saved",
              description: `Content for '${section.name}' has been updated.`
          });
          router.refresh();
          onClose();
      } else {
           toast({
              title: "Error Saving",
              description: result.error || "An unknown error occurred.",
              variant: "destructive"
          });
      }
      setIsSaving(false);
  }
  
  if (!section) return null;

  const renderFormForSection = (section: { id: string; name: string, isDynamic?: boolean }) => {
    if (section.isDynamic) {
        return <DynamicSectionForm section={section} />;
    }

    switch (section.id) {
        case 'why':
            return <WhyForm onSave={setContentData} />;
        case 'features':
            return <FeaturesForm onSave={setContentData} />;
        case 'exclusive-features':
            return <ExclusiveFeaturesForm onSave={setContentData} />;
        case 'comparison':
            return <ComparisonForm onSave={setContentData} />;
        case 'testimonials':
            return <TestimonialsForm onSave={setContentData} />;
        case 'faq':
            return <FaqForm onSave={setContentData} />;
        default:
            return <p className="text-muted-foreground text-center py-8">This section is not configured for content editing.</p>;
    }
  }

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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


    