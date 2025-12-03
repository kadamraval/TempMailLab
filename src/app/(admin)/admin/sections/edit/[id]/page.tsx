
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Slider } from '@/components/ui/slider';
import { AdminSectionPreview } from '../../admin-section-preview';


const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    const [resolvedColor, setResolvedColor] = useState("#000000");

    useEffect(() => {
        if (value && typeof window !== 'undefined') {
            // Create a temporary element to resolve the CSS variable
            const tempEl = document.createElement('div');
            tempEl.style.display = 'none';
            tempEl.style.color = value;
            document.body.appendChild(tempEl);
            
            const computedColor = window.getComputedStyle(tempEl).color;
            
            document.body.removeChild(tempEl);

            // computedColor is 'rgb(r, g, b)'
            const rgb = computedColor.match(/\d+/g);
            if (rgb) {
                const hex = '#' + rgb.map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
                setResolvedColor(hex);
            }
        }
    }, [value]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const currentOpacity = getOpacityFromValue(value);
        onChange(`rgba(${r}, ${g}, ${b}, ${currentOpacity})`);
        setResolvedColor(hex);
    };

    const getOpacityFromValue = (val: string) => {
         if (val && val.startsWith('rgba')) {
            const parts = val.split(',');
            if (parts.length === 4) {
                return parseFloat(parts[3]);
            }
        }
        return 1;
    }

    const handleOpacityChange = (newOpacity: number[]) => {
        const r = parseInt(resolvedColor.slice(1, 3), 16);
        const g = parseInt(resolvedColor.slice(3, 5), 16);
        const b = parseInt(resolvedColor.slice(5, 7), 16);
        onChange(`rgba(${r}, ${g}, ${b}, ${newOpacity[0].toFixed(2)})`);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                 <div className="relative">
                    <Input
                        type="color"
                        value={resolvedColor}
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
                    value={[getOpacityFromValue(value)]}
                    onValueChange={handleOpacityChange}
                    max={1}
                    step={0.05}
                />
            </div>
        </div>
    );
};

const BorderInputGroup = ({ side, styles, handleStyleChange }: { side: 'Top' | 'Bottom', styles: any, handleStyleChange: (prop: string, value: any) => void }) => {
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


const getInitialStyles = (id: string) => {
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
        gradientStart: 'rgba(217, 145, 119, 0.1)',
        gradientEnd: 'rgba(190, 80, 64, 0.1)'
    };
    
    if (id === 'top-title') {
        fallbackStyles.useGradient = true;
    }

    return fallbackStyles;
}

export default function EditSectionPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const sectionId = params.id as string;
    
    const [styles, setStyles] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const sectionRef = useMemoFirebase(() => {
        if (!firestore || !sectionId) return null;
        return doc(firestore, "sections", sectionId);
    }, [firestore, sectionId]);
    
    const {data: savedStyles, isLoading} = useDoc(sectionRef);

    useEffect(() => {
        const initialStyles = getInitialStyles(sectionId);
        if (savedStyles) {
            setStyles({ ...initialStyles, ...savedStyles });
        } else if (!isLoading) {
            setStyles(initialStyles);
        }
    }, [savedStyles, isLoading, sectionId]);

    const handleStyleChange = (property: string, value: any) => {
        setStyles((prevStyles: any) => ({ ...prevStyles, [property]: value }));
    };

    const handleSaveStyles = async () => {
        if (!sectionRef) return;
        setIsSaving(true);
        try {
            await setDoc(sectionRef, styles, { merge: true });
            toast({
                title: "Styles Saved!",
                description: `The default styles for the section have been updated.`,
            });
            router.refresh();
        } catch (error: any) {
            toast({ title: "Error Saving", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }
    
    const sectionName = sectionId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <div className="space-y-6">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin/sections">Sections</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                    <BreadcrumbPage>Edit Default: {sectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Preview */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Preview: {sectionName}</CardTitle>
                             <CardDescription>This preview shows how this section will look by default on all pages.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="border rounded-lg bg-background overflow-hidden">
                               <AdminSectionPreview sectionId={sectionId} styles={styles} />
                           </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Properties Editor */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Default CSS Properties</CardTitle>
                            <CardDescription>Set the global default styles for the '{sectionName}' section.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            {/* Background Controls */}
                            <div className="space-y-4 rounded-md border p-4">
                                <Label className="font-semibold">Background</Label>
                                <div className="space-y-4">
                                    <ColorInput label="Background Color" value={styles.bgColor} onChange={(value) => handleStyleChange('bgColor', value)} />
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="use-gradient">Use Gradient</Label>
                                        <Switch id="use-gradient" checked={styles.useGradient} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
                                    </div>
                                    {styles.useGradient && (
                                        <>
                                            <ColorInput label="Gradient Start Color (Top)" value={styles.gradientStart} onChange={(value) => handleStyleChange('gradientStart', value)} />
                                            <ColorInput label="Gradient End Color (Bottom)" value={styles.gradientEnd} onChange={(value) => handleStyleChange('gradientEnd', value)} />
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
                                        <Input type="number" placeholder="Top" value={styles.marginTop} onChange={(e) => handleStyleChange('marginTop', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Bottom" value={styles.marginBottom} onChange={(e) => handleStyleChange('marginBottom', e.target.valueAsNumber)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label className="text-xs">Padding (Inner Space)</Label>
                                     <div className="grid grid-cols-2 gap-2">
                                        <Input type="number" placeholder="Top" value={styles.paddingTop} onChange={(e) => handleStyleChange('paddingTop', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Bottom" value={styles.paddingBottom} onChange={(e) => handleStyleChange('paddingBottom', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Left" value={styles.paddingLeft} onChange={(e) => handleStyleChange('paddingLeft', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Right" value={styles.paddingRight} onChange={(e) => handleStyleChange('paddingRight', e.target.valueAsNumber)} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter className="border-t px-6 py-4">
                            <Button className="w-full" onClick={handleSaveStyles} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Default Styles
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
