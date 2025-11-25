
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

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    // Helper to check if a string is a valid HSL(A) color string
    const isHsl = (color: string) => typeof color === 'string' && color.startsWith('hsl');

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                 <Input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono"
                    placeholder="e.g., hsl(var(--primary)) or rgba(0,0,0,0.5)"
                />
            </div>
             {value && !isHsl(value) && (
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Opacity</Label>
                    <Input 
                        type="range" min="0" max="1" step="0.05"
                        value={(value || 'rgba(0,0,0,1)').match(/rgba?\(.*,\s*([\d.]+)\)/)?.[1] || '1'}
                        onChange={(e) => {
                            const newAlpha = e.target.value;
                            const oldColor = (value || 'rgba(0,0,0,1)').replace(/rgba?/, '').replace(')', '');
                            const [r,g,b] = oldColor.split(',');
                             onChange(`rgba(${r || 0},${g || 0},${b || 0}, ${newAlpha})`);
                        }}
                    />
                </div>
            )}
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
                    <Input id={`border${side}Color`} type="text" value={styles[`border${side}Color`] || 'hsl(var(--border))'} onChange={(e) => handleStyleChange(`border${side}Color`, e.target.value)} />
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

  // Tier 2: Get the GLOBAL DEFAULT style for this section TYPE
  const defaultStyleRef = useMemoFirebase(() => {
    if (!firestore || !section) return null;
    return doc(firestore, 'sections', section.id);
  }, [firestore, section]);

  // Tier 3: Get the PAGE-SPECIFIC style override
  const styleOverrideRef = useMemoFirebase(() => {
    if (!firestore || !section) return null;
    return doc(firestore, 'pages', pageId, 'sections', `${section.id}_styles`);
  }, [firestore, pageId, section]);

  const { data: defaultStyles, isLoading: isLoadingDefaultStyles } = useDoc(defaultStyleRef);
  const { data: savedOverrideStyles, isLoading: isLoadingOverrideStyles } = useDoc(styleOverrideRef);
  
  useEffect(() => {
    if (section) {
        // Base styles for fallback
        const baseStyles = {
            marginTop: 0, marginBottom: 0, 
            paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, 
            borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, 
            borderTopColor: 'hsl(var(--border))', borderBottomColor: 'hsl(var(--border))', borderLeftColor: 'hsl(var(--border))', borderRightColor: 'hsl(var(--border))'
        };

        // Cascade: Start with base, merge in global defaults, then merge in specific overrides
        const initialStyles = { ...baseStyles, ...(defaultStyles || {}), ...(savedOverrideStyles || {}) };
        setStyles(initialStyles);
    }
  }, [section, defaultStyles, savedOverrideStyles]);
  
  const handleStyleChange = (property: string, value: string | number | boolean) => {
    setStyles((prev: any) => ({ ...prev, [property]: value }));
  };

  const handleSaveOverride = async () => {
    if (!styleOverrideRef) return;
    setIsSaving(true);
    const result = await saveStyleOverrideAction(styleOverrideRef.path, styles);

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

  const isLoading = isLoadingDefaultStyles || isLoadingOverrideStyles;

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
          {isLoading ? (
              <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          ) : (
            <>
              {/* Background Controls */}
              <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                      <Label className="font-semibold">Background</Label>
                  </div>
                  <div className="space-y-4">
                      <ColorInput label="Background Color" value={styles.bgColor || ''} onChange={(value) => handleStyleChange('bgColor', value)} />
                      <div className="flex items-center justify-between">
                          <Label htmlFor="use-gradient">Use Gradient</Label>
                          <Switch id="use-gradient" checked={styles.useGradient || false} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
                      </div>
                      {styles.useGradient && (
                          <>
                              <ColorInput label="Gradient Start Color (Top)" value={styles.gradientStart || ''} onChange={(value) => handleStyleChange('gradientStart', value)} />
                              <ColorInput label="Gradient End Color (Bottom)" value={styles.gradientEnd || ''} onChange={(value) => handleStyleChange('gradientEnd', value)} />
                          </>
                      )}
                  </div>
              </div>

              {/* Border Controls */}
              <div className="space-y-4 rounded-md border p-4">
                  <Label className="font-semibold">Borders</Label>
                  <div className="space-y-4">
                      <BorderInputGroup side="Top" styles={styles} handleStyleChange={handleStyleChange} />
                      <Separator />
                      <BorderInputGroup side="Bottom" styles={styles} handleStyleChange={handleStyleChange} />
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
          <Button onClick={handleSaveOverride} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
