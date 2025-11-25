
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

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="color"
                    value={value.slice(0, 7)}
                    onChange={(e) => {
                        const newRgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)},${parseInt(e.target.value.slice(3, 5), 16)},${parseInt(e.target.value.slice(5, 7), 16)},${parseFloat(value.split(',')[3] || '1')})`;
                        onChange(newRgba);
                    }}
                    className="h-10 w-12 p-1"
                />
                 <Input
                    type="text"
                    value={value}
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
                    value={value.match(/rgba?\(.*,\s*([\d.]+)\)/)?.[1] || '1'}
                    onChange={(e) => {
                        const newAlpha = e.target.value;
                        const oldColor = value.replace(/rgba?/, '').replace(')', '');
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
                    <Input id={`border${side}Width`} type="number" placeholder="Size" value={styles[`border${side}Width`]} onChange={(e) => handleStyleChange(`border${side}Width`, e.target.valueAsNumber)} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Color`} className='text-xs'>Color</Label>
                    <Input id={`border${side}Color`} type="color" value={styles[`border${side}Color`]} onChange={(e) => handleStyleChange(`border${side}Color`, e.target.value)} className="h-10 w-full p-1" />
                </div>
            </div>
        </div>
    )
};


interface SectionStyleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: { id: string; name: string } | null;
  pageName: string;
}

export function SectionStyleDialog({ isOpen, onClose, section, pageName }: SectionStyleDialogProps) {
  
  // In a future step, this state will be initialized with saved override styles.
  const [styles, setStyles] = useState<any>({}); 
  const [useBackground, setUseBackground] = useState(true);
  
  const handleStyleChange = (property: string, value: string | number | boolean) => {
    setStyles((prev: any) => ({ ...prev, [property]: value }));
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
          {/* Background Controls */}
          <div className="space-y-4 rounded-md border p-4">
              <div className="flex items-center justify-between">
                  <Label className="font-semibold">Background</Label>
                  <Switch checked={useBackground} onCheckedChange={setUseBackground} />
              </div>
              {useBackground && (
                  <div className="space-y-4">
                      <ColorInput label="Background Color" value={styles.bgColor || 'rgba(0,0,0,0)'} onChange={(value) => handleStyleChange('bgColor', value)} />
                      <div className="flex items-center justify-between">
                          <Label htmlFor="use-gradient">Use Gradient</Label>
                          <Switch id="use-gradient" checked={styles.useGradient} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
