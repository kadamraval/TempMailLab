
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
import { Switch } from '@/components/ui/switch';

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
        case 'comparison': return { title: "Tempmailoz Vs Others", description: "See how we stack up against the competition.", items: comparisonFeatures };
        case 'testimonials': return { title: "What Our Users Say", description: "Hear from our satisfied customers.", items: testimonials };
        case 'blog': return { title: "From the Blog", description: "Latest news and articles from our team.", items: blogPosts };
        case 'pricing': return { title: "Pricing", description: "Choose the plan that's right for you." };
        case 'pricing-comparison': return { title: "Full Feature Comparison", description: "A detailed look at all features across our plans." };
        case 'top-title':
             const pageName = pageId.replace('-page', '').replace('-', ' ');
             const title = pageId === 'home' ? 'Secure Your Digital Identity' : (pageName.charAt(0).toUpperCase() + pageName.slice(1));
             const description = pageId === 'home' ? 'Generate instant, private, and secure temporary email addresses. Keep your real inbox safe from spam, trackers, and prying eyes.' : `Everything you need to know about our ${pageName}.`;
             return { title, description, badge: { text: "New Feature", icon: "Sparkles", show: false } };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        default: return { title: sectionId, description: "Default description", items: [] };
    }
}

const TopContentFields = ({ content, onContentChange, sectionId }: { content: any, onContentChange: (data: any) => void, sectionId: string | undefined }) => (
    <div className="space-y-4">
        <div>
            <Label>Section Title</Label>
            <Input value={content.title} onChange={(e) => onContentChange({ ...content, title: e.target.value })} />
        </div>
        <div>
            <Label>Section Description</Label>
            <Textarea value={content.description} onChange={(e) => onContentChange({ ...content, description: e.target.value })} />
        </div>

        {sectionId === 'top-title' && content.badge && (
          <div className="p-4 border rounded-md space-y-4">
            <Label className="font-semibold">Badge Settings</Label>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <Label>Show Badge</Label>
              <Switch checked={content.badge.show} onCheckedChange={(val) => onContentChange({ ...content, badge: {...content.badge, show: val} })}/>
            </div>
            <Label>Badge Icon</Label>
            <IconPicker value={content.badge.icon} onChange={(val) => onContentChange({ ...content, badge: {...content.badge, icon: val} })} />
            <Label>Badge Text</Label>
            <Input value={content.badge.text} onChange={(e) => onContentChange({ ...content, badge: {...content.badge, text: e.target.value} })} />
          </div>
        )}

        {sectionId !== 'top-title' && <Separator />}
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
                content={content} 
                onContentChange={onContentChange}
                sectionId="why"
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
                content={content} 
                onContentChange={onContentChange}
                sectionId="faq"
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
                content={content}
                onContentChange={onContentChange}
                sectionId={section.id}
            />
             {isSectionDynamic(section.id) && <p className="text-muted-foreground text-center py-8">The core content of this dynamic section is managed automatically and cannot be edited here.</p>}
        </div>
    )
}

const GenericForm = ({ content, onContentChange, sectionId }: { content: any, onContentChange: (data: any) => void, sectionId: string }) => (
     <div className="space-y-4">
        <TopContentFields 
            content={content} 
            onContentChange={onContentChange}
            sectionId={sectionId}
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
          const defaultContent = getDefaultContent(pageId, section.id);
          if (savedContent) {
              // Merge saved content with defaults to ensure all fields are present (e.g., new 'badge' field)
              const mergedContent = { ...defaultContent, ...savedContent, badge: {...defaultContent.badge, ...savedContent.badge} };
              setContentData(mergedContent);
          } else if (!isLoadingContent) {
              // If not loading and no saved content, load the default
              setContentData(defaultContent);
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
        case 'testimonials':
            return <GenericForm content={contentData} onContentChange={setContentData} sectionId={section.id} />;
        case 'faq':
            return <FaqForm content={contentData} onContentChange={setContentData} />;
        default:
             if (isSectionDynamic(section.id)) {
                return <SimpleForm section={section} content={contentData} onContentChange={setContentData} />;
            }
            return <GenericForm content={contentData} onContentChange={setContentData} sectionId={section.id} />;
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
