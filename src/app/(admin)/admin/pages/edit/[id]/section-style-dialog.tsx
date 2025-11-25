
"use client";

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { saveStyleOverrideAction } from '@/lib/actions/content';

const sectionDefaultStyles: { [key: string]: any } = {
    "inbox": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.3)', paddingTop: 64, paddingBottom: 64 },
    "top-title": { bgColor: 'rgba(0,0,0,0)', useGradient: false, paddingTop: 64, paddingBottom: 64 },
    "why": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "features": { bgColor: 'hsl(var(--background))', useGradient: false },
    "exclusive-features": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "comparison": { bgColor: 'hsl(var(--background))', useGradient: false },
    "pricing": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "pricing-comparison": { bgColor: 'hsl(var(--background))', useGradient: false },
    "blog": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "testimonials": { bgColor: 'hsl(var(--background))', useGradient: false },
    "faq": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)', paddingTop: 64, paddingBottom: 64 },
    "newsletter": { bgColor: 'hsl(var(--background))', useGradient: false, borderTopWidth: 1, paddingTop: 64, paddingBottom: 64 },
    "contact-form": { bgColor: 'hsl(var(--background))', useGradient: false, paddingTop: 80, paddingBottom: 80 },
    "knowledgebase": { bgColor: 'hsl(var(--background))', useGradient: false, paddingTop: 64, paddingBottom: 64 },
};


const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="color"
                    value={(value || '#000000').slice(0, 7)}
                    onChange={(e) => {
                        const currentVal = value || 'rgba(0,0,0,1)';
                        const alpha = parseFloat(currentVal.split(',')[3] || '1');
                        const newRgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)},${parseInt(e.target.value.slice(3, 5), 16)},${parseInt(e.target.value.slice(5, 7), 16)},${alpha})`;
                        onChange(newRgba);
                    }}
                    className="h-10 w-12 p-1"
                />
                 <Input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono"
                />
            </div>
             <div className="flex items-center gap-2">
                <Label className="text-xs">Opacity</Label>
                <Input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={(value || 'rgba(0,0,0,1)').match(/rgba?\(.*,\s*([\d.]+)\)/)?.[1] || '1'}
                    onChange={(e) => {
                        const newAlpha = e.target.value;
                        const oldColor = (value || 'rgba(0,0,0,1)').replace(/rgba?/, '').replace(')', '');
                        const [r,g,b] = oldColor.split(',');
                         onChange(`rgba(${r},${g},${b}, ${newAlpha})`);
                    }}
                />
            </div>
        </div>
    );
};

const BorderInputGroup = ({ side, styles, handleStyleChange }: { side: 'Top' | 'Bottom' | 'Left' | 'Right', styles: any, handleStyleChange: (prop: string, value: any) => void }) => {
    return (
        <div className="space-y-3">
            <Label className="font-semibold">{side} Border</Label>
            <div className="grid grid-cols-2 gap-2">
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Width`} className='text-xs'>Size (px)</Label>
                    <Input id={`border${side}Width`} type="number" placeholder="Size" value={styles[`border${side}Width`] || 0} onChange={(e) => handleStyleChange(`border${side}Width`, e.target.valueAsNumber)} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Color`} className='text-xs'>Color</Label>
                    <Input id={`border${side}Color`} type="color" value={styles[`border${side}Color`] || '#000000'} onChange={(e) => handleStyleChange(`border${side}Color`, e.target.value)} className="h-10 w-full p-1" />
                </div>
            </div>
        </div>
    )
};


interface SectionStyleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string } | null;
  pageId: string;
  pageName: string;
}

export function SectionStyleDialog({ isOpen, onClose, section, pageId, pageName }: SectionStyleDialogProps) {
  const { toast } = useToast();
  const [styles, setStyles] = useState<any>({}); 
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();

  const overrideId = section ? `${pageId}_${section.id}` : null;
  const styleOverrideRef = useMemoFirebase(() => {
      if (!firestore || !overrideId) return null;
      return doc(firestore, 'page_style_overrides', overrideId);
  }, [firestore, overrideId]);

  const { data: savedStyles, isLoading: isLoadingStyles } = useDoc(styleOverrideRef);

  useEffect(() => {
    if (section) {
        const defaultStyles = sectionDefaultStyles[section.id] || {};
        const globalDefaults = {
            marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, 
            paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, 
            borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, 
            borderTopColor: '#e5e7eb', borderBottomColor: '#e5e7eb', borderLeftColor: '#e5e7eb', borderRightColor: '#e5e7eb'
        };
        const initialStyles = { ...globalDefaults, ...defaultStyles };
        
        if (savedStyles) {
            setStyles({ ...initialStyles, ...savedStyles });
        } else {
            setStyles(initialStyles);
        }
    }
  }, [section, savedStyles]);
  
  const handleStyleChange = (property: string, value: string | number | boolean) => {
    setStyles((prev: any) => ({ ...prev, [property]: value }));
  };

  const handleSaveOverride = async () => {
    if (!overrideId) return;
    setIsSaving(true);
    const result = await saveStyleOverrideAction(overrideId, styles);

    if (result.success) {
        toast({
            title: "Style Override Saved",
            description: `Custom styles for '${section?.name}' on the '${pageName}' page have been saved.`
        });
        onClose();
    } else {
        toast({
            title: "Error Saving Style",
            description: result.error || "An unknown error occurred.",
            variant: "destructive"
        });
    }
    setIsSaving(false);
  };
  
  if (!section) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Styles for '{section.name}'</DialogTitle>
          <DialogDescription>
            You are overriding the default styles for this section on the <span className="font-bold">{pageName}</span> page only.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-6">
          {isLoadingStyles ? (
              <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          ) : (
            <>
              {/* Background Controls */}
              <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                      <Label className="font-semibold">Background</Label>
                      <Switch checked={styles.bgColor && styles.bgColor !== 'rgba(0,0,0,0)'} onCheckedChange={(checked) => handleStyleChange('bgColor', checked ? 'hsl(var(--background))' : 'rgba(0,0,0,0)')} />
                  </div>
                  {styles.bgColor && styles.bgColor !== 'rgba(0,0,0,0)' && (
                      <div className="space-y-4">
                          <ColorInput label="Background Color" value={styles.bgColor || 'rgba(0,0,0,0)'} onChange={(value) => handleStyleChange('bgColor', value)} />
                          <div className="flex items-center justify-between">
                              <Label htmlFor="use-gradient">Use Gradient</Label>
                              <Switch id="use-gradient" checked={styles.useGradient || false} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
                          </div>
                          {styles.useGradient && (
                              <>
                                  <ColorInput label="Gradient Start Color (Top)" value={styles.gradientStart || 'rgba(255,255,255,1)'} onChange={(value) => handleStyleChange('gradientStart', value)} />
                                  <ColorInput label="Gradient End Color (Bottom)" value={styles.gradientEnd || 'rgba(240,248,255,1)'} onChange={(value) => handleStyleChange('gradientEnd', value)} />
                              </>
                          )}
                      </div>
                  )}
              </div>

              {/* Border Controls */}
              <div className="space-y-4 rounded-md border p-4">
                  <Label className="font-semibold">Borders</Label>
                  <div className="space-y-4">
                      <BorderInputGroup side="Top" styles={styles} handleStyleChange={handleStyleChange} />
                      <Separator />
                      <BorderInputGroup side="Bottom" styles={styles} handleStyleChange={handleStyleChange} />
                      <Separator />
                      <BorderInputGroup side="Left" styles={styles} handleStyleChange={handleStyleChange} />
                      <Separator />
                      <BorderInputGroup side="Right" styles={styles} handleStyleChange={handleStyleChange} />
                  </div>
              </div>
              
              {/* Margin and Padding */}
              <div className="space-y-4 rounded-md border p-4">
                  <Label className="font-semibold">Spacing (in pixels)</Label>
                  <div className="space-y-2">
                      <Label className="text-xs">Margin (Outer Space)</Label>
                      <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="Top" value={styles.marginTop || 0} onChange={(e) => handleStyleChange('marginTop', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Bottom" value={styles.marginBottom || 0} onChange={(e) => handleStyleChange('marginBottom', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Left" value={styles.marginLeft || 0} onChange={(e) => handleStyleChange('marginLeft', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Right" value={styles.marginRight || 0} onChange={(e) => handleStyleChange('marginRight', e.target.valueAsNumber)} />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-xs">Padding (Inner Space)</Label>
                      <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="Top" value={styles.paddingTop || 0} onChange={(e) => handleStyleChange('paddingTop', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Bottom" value={styles.paddingBottom || 0} onChange={(e) => handleStyleChange('paddingBottom', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Left" value={styles.paddingLeft || 0} onChange={(e) => handleStyleChange('paddingLeft', e.target.valueAsNumber)} />
                          <Input type="number" placeholder="Right" value={styles.paddingRight || 0} onChange={(e) => handleStyleChange('paddingRight', e.target.valueAsNumber)} />
                      </div>
                  </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveOverride} disabled={isSaving || isLoadingStyles}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    