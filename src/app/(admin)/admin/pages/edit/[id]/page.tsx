"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brush, FileText, Eye, EyeOff, Trash2, GripVertical, PlusCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionStyleDialog } from './section-style-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SectionContentDialog } from './section-content-dialog';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { savePageSectionsAction, savePageSettingsAction } from '@/lib/actions/content';
import { AddSectionDialog } from './add-section-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


export default function EditPageLayout() {
  const params = useParams();
  const pageId = params.id as string;

  const [localSections, setLocalSections] = useState<any[]>([]);
  const [editingStyleSection, setEditingStyleSection] = useState<any | null>(null);
  const [editingContentSection, setEditingContentSection] = useState<any | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pageSettings, setPageSettings] = useState<any>({});
  
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const pageRef = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);

  const { data: savedPageSettings, isLoading: isLoadingPageSettings, error: pageError } = useDoc(pageRef);
  
  const sectionsQuery = useMemoFirebase(() => {
    if (!pageRef) return null;
    return query(collection(pageRef, 'sections'), orderBy('order'));
  }, [pageRef]);

  const { data: pageSections, isLoading: isLoadingSections } = useCollection(sectionsQuery);

  useEffect(() => {
    if (savedPageSettings) {
      setPageSettings(savedPageSettings);
    }
  }, [savedPageSettings]);

  useEffect(() => {
    if (pageSections) {
        setLocalSections(pageSections);
    }
  }, [pageSections]);

  if (!isLoadingPageSettings && !savedPageSettings) {
    return notFound();
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("draggedIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
      const newSections = [...localSections];
      const [draggedItem] = newSections.splice(draggedIndex, 1);
      newSections.splice(dropIndex, 0, draggedItem);
      const reorderedSections = newSections.map((s, i) => ({ ...s, order: i }));
      setLocalSections(reorderedSections);
      handleSaveSections(reorderedSections);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleSaveSections = async (sectionsToSave: any[]) => {
    setIsSaving(true);
    const result = await savePageSectionsAction(pageId, sectionsToSave);
    if (result.success) {
      toast({ title: "Page updated!", description: "Section changes have been saved." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleSettingsSave = async () => {
    setIsSaving(true);
    const result = await savePageSettingsAction(pageId, pageSettings);
    if (result.success) {
        toast({ title: "Page settings saved!" });
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleSettingsChange = (field: string, value: any) => {
    setPageSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleSectionVisibility = async (section: any) => {
    const updatedSections = localSections.map(s => s.id === section.id ? { ...s, hidden: !s.hidden } : s);
    setLocalSections(updatedSections);
    handleSaveSections(updatedSections);
    toast({ title: `Section now ${!section.hidden ? 'Hidden' : 'Visible'}` });
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    
    const updatedSections = localSections.filter(s => s.id !== deletingSection.id);
    const reorderedSections = updatedSections.map((s, i) => ({...s, order: i}));
    setLocalSections(reorderedSections);
    
    await handleSaveSections(reorderedSections);

    toast({ title: "Section Removed", description: `'${deletingSection.name}' has been removed from this page.` });
    setDeletingSection(null);
  };

  const handleAddSections = (addedSections: any[]) => {
      const newLocalSections = [...localSections];
      addedSections.forEach(sec => {
          if (!newLocalSections.some(ls => ls.id === sec.id)) {
              newLocalSections.push({ ...sec, order: newLocalSections.length, hidden: false });
          }
      });
      const reordered = newLocalSections.map((s, i) => ({...s, order: i}));
      setLocalSections(reordered);
      handleSaveSections(reordered);
  };
  
  return (
    <>
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/pages">Pages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit: {pageSettings.name || 'Loading...'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center">
             <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Page Sections</h1>
                <p className="text-muted-foreground">Drag and drop to reorder sections.</p>
             </div>
             <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                <Button onClick={() => setIsAddSectionOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Add Section</Button>
                <Button onClick={() => router.push(`/${pageId === 'home' ? '' : pageSettings.slug || pageId}`)} variant="outline" disabled={pageSettings.status !== 'Published'}>View Live Page</Button>
            </div>
          </div>
          {isLoadingSections ? (
            <div className="flex items-center justify-center h-64 border rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <TooltipProvider>
                <div className="space-y-2">
                {localSections.map((section: any, index: number) => (
                    <div key={section.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDrop={(e) => handleDrop(e, index)} onDragOver={handleDragOver}>
                        <Card className={section.hidden ? 'bg-muted/50' : 'bg-card'}>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <CardTitle className="text-base font-medium">{section.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingStyleSection(section)}><Brush className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit Section Styles</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingContentSection(section)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit Content</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => toggleSectionVisibility(section)}>{section.hidden ? <EyeOff className="h-4 w-4 text-blue-500" /> : <Eye className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{section.hidden ? 'Show Section' : 'Hide Section'}</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingSection(section)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove Section</p></TooltipContent></Tooltip>
                            </div>
                        </CardHeader>
                        </Card>
                    </div>
                ))}
                </div>
            </TooltipProvider>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6 sticky top-20">
           <Card>
                <CardHeader><CardTitle>Page Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="page-name">Page Name</Label>
                        <Input id="page-name" value={pageSettings.name || ''} onChange={(e) => handleSettingsChange('name', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="page-slug">Page Slug (URL)</Label>
                        <Input id="page-slug" value={pageSettings.slug || ''} onChange={(e) => handleSettingsChange('slug', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label>Status</Label>
                            <CardDescription>Draft pages are not visible to the public.</CardDescription>
                        </div>
                        <Switch checked={pageSettings.status === 'Published'} onCheckedChange={(checked) => handleSettingsChange('status', checked ? 'Published' : 'Draft')} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSettingsSave} disabled={isSaving}>Save Page Settings</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader><CardTitle>SEO Settings</CardTitle><CardDescription>Optimize this page for search engines and social media.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="meta-title">Meta Title</Label>
                        <Input id="meta-title" placeholder="Enter meta title" value={pageSettings.metaTitle || ''} onChange={(e) => handleSettingsChange('metaTitle', e.target.value)} />
                        <CardDescription className="text-xs">Recommended: 50-60 characters.</CardDescription>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="meta-description">Meta Description</Label>
                        <Textarea id="meta-description" placeholder="Enter meta description" rows={4} value={pageSettings.metaDescription || ''} onChange={(e) => handleSettingsChange('metaDescription', e.target.value)} />
                        <CardDescription className="text-xs">Recommended: 150-160 characters.</CardDescription>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="meta-keywords">Keywords</Label>
                        <Input id="meta-keywords" placeholder="e.g., temp mail, disposable email" value={pageSettings.metaKeywords || ''} onChange={(e) => handleSettingsChange('metaKeywords', e.target.value)} />
                        <CardDescription className="text-xs">Comma-separated keywords.</CardDescription>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSettingsSave} disabled={isSaving}>Save SEO Changes</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>

    <SectionStyleDialog isOpen={!!editingStyleSection} onClose={() => setEditingStyleSection(null)} section={editingStyleSection} pageId={pageId} pageName={pageSettings.name} />
    <SectionContentDialog isOpen={!!editingContentSection} onClose={() => setEditingContentSection(null)} section={editingContentSection} pageId={pageId} />
    <AddSectionDialog isOpen={isAddSectionOpen} onClose={() => setIsAddSectionOpen(false)} existingSectionIds={localSections.map(s => s.id)} onAddSections={handleAddSections} />
    <AlertDialog open={!!deletingSection} onOpenChange={(open) => !open && setDeletingSection(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the '{deletingSection?.name}' section from this page. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSection} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
