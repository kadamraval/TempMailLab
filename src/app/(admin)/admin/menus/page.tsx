
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenuAction } from '@/lib/actions/menus';

const ItemTypes = {
  MENU_ITEM: 'menu_item',
};

const DraggableMenuItem = ({ id, text, moveItem, index }: any) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.MENU_ITEM,
    hover(item: any) {
      if (!ref.current) return;
      if (item.index === index) return;
      moveItem(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MENU_ITEM,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 p-2 border rounded-md bg-background cursor-move"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
};

export default function AdminMenusPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [headerMenuItems, setHeaderMenuItems] = useState<any[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<any[]>([]);
  const [checkedPages, setCheckedPages] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const pagesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pages') : null, [firestore]);
  const { data: pages, isLoading: isLoadingPages } = useCollection(pagesQuery);

  const headerMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'header') : null, [firestore]);
  const { data: headerMenuData, isLoading: isLoadingHeader } = useDoc(headerMenuRef);

  const footerMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'footer') : null, [firestore]);
  const { data: footerMenuData, isLoading: isLoadingFooter } = useDoc(footerMenuRef);
  
  useEffect(() => {
    if (headerMenuData?.items) {
      setHeaderMenuItems(headerMenuData.items);
    }
  }, [headerMenuData]);

  useEffect(() => {
    if (footerMenuData?.items) {
      setFooterMenuItems(footerMenuData.items);
    }
  }, [footerMenuData]);

  const handleAddToMenu = (menu: 'header' | 'footer') => {
    const pagesToAdd = pages?.filter(p => checkedPages[p.id]).map(p => ({
      id: p.id,
      label: p.name,
      href: p.id === 'home' ? '/' : `/${p.id}`,
    })) || [];

    if (menu === 'header') {
      setHeaderMenuItems(prev => [...prev, ...pagesToAdd]);
    } else {
      setFooterMenuItems(prev => [...prev, ...pagesToAdd]);
    }
    setCheckedPages({});
  };

  const moveHeaderItem = (from: number, to: number) => {
    const newItems = [...headerMenuItems];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setHeaderMenuItems(newItems);
  };
  
  const moveFooterItem = (from: number, to: number) => {
    const newItems = [...footerMenuItems];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setFooterMenuItems(newItems);
  };
  
  const handleSaveMenus = async () => {
    setIsSaving(true);
    const headerResult = await saveMenuAction('header', headerMenuItems);
    const footerResult = await saveMenuAction('footer', footerMenuItems);

    if (headerResult.success && footerResult.success) {
      toast({ title: 'Success', description: 'Menus have been saved successfully.' });
    } else {
      toast({ title: 'Error', description: 'Failed to save menus.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const isLoading = isLoadingPages || isLoadingHeader || isLoadingFooter;

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Menus</h1>
                <p className="text-muted-foreground">Manage the navigation menus for your website's header and footer.</p>
            </div>
            <Button onClick={handleSaveMenus} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Menus
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Pages</CardTitle>
              <CardDescription>Select pages to add to a menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pages?.map(page => (
                <div key={page.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`page-${page.id}`}
                    checked={checkedPages[page.id] || false}
                    onCheckedChange={checked =>
                      setCheckedPages(prev => ({ ...prev, [page.id]: checked }))
                    }
                  />
                  <label htmlFor={`page-${page.id}`}>{page.name}</label>
                </div>
              ))}
              <div className='flex gap-2 pt-4'>
                <Button size="sm" variant="outline" onClick={() => handleAddToMenu('header')}>Add to Header</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddToMenu('footer')}>Add to Footer</Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Header Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {headerMenuItems.map((item, index) => (
                  <DraggableMenuItem
                    key={item.id}
                    id={item.id}
                    text={item.label}
                    index={index}
                    moveItem={moveHeaderItem}
                  />
                ))}
                {headerMenuItems.length === 0 && <p className="text-sm text-muted-foreground">No items in this menu.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 {footerMenuItems.map((item, index) => (
                  <DraggableMenuItem
                    key={item.id}
                    id={item.id}
                    text={item.label}
                    index={index}
                    moveItem={moveFooterItem}
                  />
                ))}
                 {footerMenuItems.length === 0 && <p className="text-sm text-muted-foreground">No items in this menu.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
