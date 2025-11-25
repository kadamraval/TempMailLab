
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
import { IconPicker } from '@/components/icon-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveContentAction } from '@/lib/actions/content';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useCases, features, faqs, comparisonFeatures, testimonials, exclusiveFeatures, blogPosts } from '@/lib/content-data';

interface SectionContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string, isDynamic?: boolean } | null;
  pageId: string;
}

const getDefaultContent = (pageId: string, sectionId: string) => {
    switch (sectionId) {
        case 'why': return { title: "Why Temp Mail?", description: "Protect your online identity with a disposable email address.", items: useCases };
        case 'features': return { title: "Features", description: "Discover the powerful features that make our service unique.", items: features };
        case 'exclusive-features': return { title: "Exclusive Features", description: "Unlock premium features for the ultimate temporary email experience.", items: exclusiveFeatures };
        case 'faq': return { title: "Questions?", description: "Find answers to frequently asked questions.", items: faqs };
        case 'comparison': return { title: "Tempmailoz Vs Others", description: "", items: comparisonFeatures };
        case 'testimonials': return { title: "What Our Users Say", description: "", items: testimonials };
        case 'blog': return { title: "From the Blog", description: "", items: blogPosts };
        case 'pricing': return { title: "Pricing", description: "Choose the plan that's right for you." };
        case 'pricing-comparison': return { title: "Full Feature Comparison", description: "" };
        case 'top-title':
             const pageName = pageId.replace('-page', '').replace('-', ' ');
             return { title: pageName.charAt(0).toUpperCase() + pageName.slice(1), description: `Everything you need to know about our ${pageName}.` };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        default: return { title: sectionId, description: "", items: [] };
    }
}

const TopContentFields = ({ title, description, onTitleChange, onDescriptionChange, isDynamic }: { title: string, description: string, onTitleChange: (val: string) => void, onDescriptionChange: (val: string) => void, isDynamic?: boolean }) => (
    <div className="space-y-4">
        <div>
            <Label>Section Title</Label>
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </div>
        <div>
            <Label>Section Description</Label>
            <Textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
        </div>
        {!isDynamic && <Separator />}
    </div>
);

const WhyForm = ({ content, onContentChange }: { content: any, onContentChange: (data: any) => void }) => {

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content.items];
        (newItems[index] as any)[field] = value;
        onContentChange({ ...content, items: newItems });
    };

    const handleAddItem = () => {
        const newItems = [...content.items, { iconName: "Star", title: "New Item", description: "New description" }];
        onContentChange({ ...content, items: newItems });
    };
    
    const handleRemoveItem = (index: number) => {
        const newItems = content.items.filter((_:any, i:number) => i !== index);
        onContentChange({ ...content, items: newItems });
    };

    return (
        <div className="space-y-4">
            <TopContentFields 
                title={content.title} 
                description={content.description} 
                onTitleChange={(val) => onContentChange({ ...content, title: val })} 
                onDescriptionChange={(val) => onContentChange({ ...content, description: val })}
            />
            {content.items.map((item: any, index: number) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Item {index + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Icon Name (from lucide-react)</Label>
                    <IconPicker value={item.iconName} onChange={(val) => handleItemChange(index, 'iconName', val)} />
                    <Label>Title</Label>
                    <Input value={item.title} onChange={(e) => handleItemChange(index, 'title', e.target.value)} />
                    <Label>Description</Label>
                    <Textarea value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                </div>
            ))}
             <Button variant="outline" className="w-full" onClick={handleAddItem}><PlusCircle className="h-4 w-4 mr-2" /> Add Card</Button>
        </div>
    )
}

const FaqForm = ({ content, onContentChange }: { content: any, onContentChange: (data: any) => void }) => {
    
    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...content.items];
        (newItems[index] as any)[field] = value;
        onContentChange({ ...content, items: newItems });
    };

    const handleAddItem = () => {
        const newItems = [...content.items, { question: "New Question?", answer: "New answer." }];
        onContentChange({ ...content, items: newItems });
    };

     const handleRemoveItem = (index: number) => {
        const newItems = content.items.filter((_:any, i:number) => i !== index);
        onContentChange({ ...content, items: newItems });
    };

    return (
        <div className="space-y-4">
             <TopContentFields 
                title={content.title} 
                description={content.description}
                onTitleChange={(val) => onContentChange({ ...content, title: val })} 
                onDescriptionChange={(val) => onContentChange({ ...content, description: val })}
            />
             {content.items.map((item: any, index: number) => (
                <div key={index} className="space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                        <Label>Question {index + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Label>Question</Label>
                    <Input value={item.question} onChange={(e) => handleItemChange(index, 'question', e.target.value)} />
                    <Label>Answer</Label>
                    <Textarea value={item.answer} onChange={(e) => handleItemChange(index, 'answer', e.target.value)} rows={4} />
                </div>
             ))}
            <Button variant="outline" className="w-full" onClick={handleAddItem}><PlusCircle className="h-4 w-4 mr-2" /> Add FAQ</Button>
        </div>
    )
}

const isSectionDynamic = (sectionId: string) => {
    const dynamicSections = ['inbox', 'pricing', 'pricing-comparison', 'blog', 'contact-form'];
    return dynamicSections.includes(sectionId);
}

// Form for sections that are "dynamic" (e.g. pricing, blog) or simple title/desc
const SimpleForm = ({ content, onContentChange, section }: { content: any, onContentChange: (data: any) => void, section: { id: string; name: string } }) => {
    return (
        <div className="space-y-4">
            <TopContentFields 
                title={content.title} 
                description={content.description}
                onTitleChange={(val) => onContentChange({ ...content, title: val })} 
                onDescriptionChange={(val) => onContentChange({ ...content, description: val })}
                isDynamic={true}
            />
             {isSectionDynamic(section.id) && <p className="text-muted-foreground text-center py-8">The core content of this dynamic section is managed automatically and cannot be edited here.</p>}
        </div>
    )
}

const GenericForm = ({ content, onContentChange }: { content: any, onContentChange: (data: any) => void }) => (
     <div className="space-y-4">
        <TopContentFields 
            title={content?.title || ''} 
            description={content?.description || ''}
            onTitleChange={(val) => onContentChange({ ...content, title: val })} 
            onDescriptionChange={(val) => onContentChange({ ...content, description: val })}
        />
        <p className="text-muted-foreground text-center py-8">This section's detailed content is not yet editable.</p>
    </div>
);


export function SectionContentDialog({ isOpen, onClose, section, pageId }: SectionContentDialogProps) {
  const [contentData, setContentData] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const contentRef = useMemoFirebase(() => {
    if (!firestore || !section) return null;
    return doc(firestore, 'pages', pageId, 'sections', section.id);
  }, [firestore, pageId, section]);

  const { data: savedContent, isLoading: isLoadingContent } = useDoc(contentRef);
  
  React.useEffect(() => {
      if (section) {
          if (savedContent) {
              setContentData(savedContent);
          } else if (!isLoadingContent) {
              // If not loading and no saved content, load the default
              setContentData(getDefaultContent(pageId, section.id));
          }
      }
  }, [savedContent, isLoadingContent, section, pageId]);


  const handleSave = async () => {
      if (!contentRef || !contentData) return;
      setIsSaving(true);
      const result = await saveContentAction(contentRef.path, contentData);

      if (result.success) {
          toast({
              title: "Content Saved",
              description: `Content for '${section?.name}' has been updated.`
          });
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

  const renderFormForSection = (section: { id: string; name: string }) => {
    if (isLoadingContent || !contentData) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    switch (section.id) {
        case 'top-title':
            return <SimpleForm section={section} content={contentData} onContentChange={setContentData} />;
        case 'why':
        case 'features':
        case 'exclusive-features':
            return <WhyForm content={contentData} onContentChange={setContentData} />;
        case 'comparison':
            return <GenericForm content={contentData} onContentChange={setContentData} />;
        case 'testimonials':
            return <GenericForm content={contentData} onContentChange={setContentData} />;
        case 'faq':
            return <FaqForm content={contentData} onContentChange={setContentData} />;
        default:
             if (isSectionDynamic(section.id)) {
                return <SimpleForm section={section} content={contentData} onContentChange={setContentData} />;
            }
            return <GenericForm content={contentData} onContentChange={setContentData} />;
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
          <Button onClick={handleSave} disabled={isSaving || isLoadingContent}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
