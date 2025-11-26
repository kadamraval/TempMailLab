
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Slider } from '@/components/ui/slider';


const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    const [color, opacity] = useMemo(() => {
        if (!value || typeof value !== 'string') return ['#000000', 1];
        if (value.startsWith('hsl')) {
            // This is a basic fallback for HSL variables. A more robust solution might parse the variable.
             return ['#000000', 1];
        }
        if (value.startsWith('rgba')) {
            const parts = value.replace(/rgba?\(|\)/g, '').split(',').map(s => s.trim());
            if (parts.length === 4) {
                const hex = `#${parseInt(parts[0]).toString(16).padStart(2, '0')}${parseInt(parts[1]).toString(16).padStart(2, '0')}${parseInt(parts[2]).toString(16).padStart(2, '0')}`;
                return [hex, parseFloat(parts[3])];
            }
        }
         if (value.startsWith('#')) {
            const r = parseInt(value.slice(1, 3), 16);
            const g = parseInt(value.slice(3, 5), 16);
            const b = parseInt(value.slice(5, 7), 16);
            // If it's a hex, we can't know the opacity, so we assume 1 and convert to rgba for consistency
            if (value.length === 7) {
                 onChange(`rgba(${r}, ${g}, ${b}, 1)`);
                 return [value, 1];
            }
            return [value, 1];
        }
        return [value, 1];
    }, [value]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        onChange(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    };

    const handleOpacityChange = (newOpacity: number[]) => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        onChange(`rgba(${r}, ${g}, ${b}, ${newOpacity[0]})`);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                 <div className="relative">
                    <Input
                        type="color"
                        value={color}
                        onChange={handleColorChange}
                        className="w-12 h-10 p-1"
                    />
                </div>
                <Input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono"
                    placeholder="e.g., rgba(255,255,255,1)"
                />
            </div>
             <div className="space-y-2 pt-2">
                <Label className="text-xs">Opacity</Label>
                <Slider
                    value={[opacity]}
                    onValueChange={handleOpacityChange}
                    max={1}
                    step={0.05}
                />
            </div>
        </div>
    );
};


const BorderInputGroup = ({ side, styles, handleStyleChange }: { side: 'Top' | 'Bottom' | 'Left' | 'Right', styles: any, handleStyleChange: (prop: string, value: any) => void }) => {
    return (
        <div className="space-y-3">
            <Label className="font-semibold">{side} Border</Label>
            <div className='space-y-2'>
                <Label htmlFor={`border${side}Width`} className='text-xs'>Size (px)</Label>
                <Input id={`border${side}Width`} type="number" placeholder="Size" value={styles[`border${side}Width`] || 0} onChange={(e) => handleStyleChange(`border${side}Width`, e.target.valueAsNumber)} />
            </div>
            <ColorInput label={`${side} Border Color`} value={styles[`border${side}Color`] || 'hsl(var(--border))'} onChange={(value) => handleStyleChange(`border${side}Color`, value)} />
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

const getInitialStyles = (sectionId: string) => {
    const fallbackStyles: any = {
        marginTop: 0, 
        marginBottom: 0, 
        paddingTop: 64, 
        paddingBottom: 64, 
        paddingLeft: 16, 
        paddingRight: 16,
        borderTopWidth: 0, 
        borderBottomWidth: 0, 
        borderTopColor: 'hsl(var(--border))', 
        borderBottomColor: 'hsl(var(--border))',
        bgColor: 'transparent',
        useGradient: false, 
        gradientStart: 'hsl(var(--gradient-start))', 
        gradientEnd: 'hsl(var(--gradient-end))'
    };
    
    if (sectionId === 'top-title') {
        fallbackStyles.useGradient = true;
    }

    return fallbackStyles;
};

// Deep merge utility
const isObject = (item: any) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const mergeDeep = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (source[key] !== undefined && source[key] !== null) { // Only merge defined values
          if (isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            mergeDeep(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
      }
    }
  }
  return mergeDeep(target, ...sources);
};


export function SectionStyleDialog({ isOpen, onClose, section, pageId, pageName }: SectionStyleDialogProps) {
  const { toast } = useToast();
  const [styles, setStyles] = useState<any>({}); 
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();

  const defaultStyleRef = useMemoFirebase(() => {
    if (!firestore || !section) return null;
    return doc(firestore, 'sections', section.id);
  }, [firestore, section]);

  const styleOverrideRef = useMemoFirebase(() => {
    if (!firestore || !section) return null;
    return doc(firestore, 'pages', pageId, 'sections', `${section.id}_styles`);
  }, [firestore, pageId, section]);

  const { data: defaultStyles, isLoading: isLoadingDefaultStyles } = useDoc(defaultStyleRef);
  const { data: savedOverrideStyles, isLoading: isLoadingOverrideStyles } = useDoc(styleOverrideRef);
  
  useEffect(() => {
    if (section && !isLoadingDefaultStyles && !isLoadingOverrideStyles) {
        const initialStyles = getInitialStyles(section.id);
        const finalStyles = mergeDeep({}, initialStyles, defaultStyles, savedOverrideStyles);
        setStyles(finalStyles);
    }
  }, [section, defaultStyles, savedOverrideStyles, isLoadingDefaultStyles, isLoadingOverrideStyles, pageId]);
  
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
