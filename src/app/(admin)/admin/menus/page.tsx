'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveMenuAction } from '@/lib/actions/menus';

const ItemTypes = {
  MENU_ITEM: 'menu_item',
};

const DraggableMenuItem = ({ item, moveItem, index, onRemove }: any) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.MENU_ITEM,
    hover(draggedItem: any) {
      if (!ref.current) return;
      if (draggedItem.index === index) return;
      moveItem(draggedItem.index, index);
      draggedItem.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MENU_ITEM,
    item: { id: item.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 p-2 border rounded-md bg-background"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
      <span className="flex-grow">{item.label}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(index)}>
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
};

const MenuBuilder = ({ title, items, setItems, moveItem, onRemove }: { title: string, items: any[], setItems: any, moveItem: any, onRemove: any }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <DraggableMenuItem
            key={item.id}
            item={item}
            index={index}
            moveItem={moveItem}
            onRemove={onRemove}
          />
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items in this menu. Add pages from the left.</p>}
      </CardContent>
    </Card>
);


export default function AdminMenusPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [headerMenuItems, setHeaderMenuItems] = useState<any[]>([]);
  const [topFooterMenuItems, setTopFooterMenuItems] = useState<any[]>([]);
  const [bottomFooterMenuItems, setBottomFooterMenuItems] = useState<any[]>([]);
  const [checkedPages, setCheckedPages] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const pagesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pages') : null, [firestore]);
  const { data: pages, isLoading: isLoadingPages } = useCollection(pagesQuery);

  const headerMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'header') : null, [firestore]);
  const { data: headerMenuData, isLoading: isLoadingHeader } = useDoc(headerMenuRef);
  
  const topFooterMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'footer-top') : null, [firestore]);
  const { data: topFooterMenuData, isLoading: isLoadingTopFooter } = useDoc(topFooterMenuRef);

  const bottomFooterMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'footer-bottom') : null, [firestore]);
  const { data: bottomFooterMenuData, isLoading: isLoadingBottomFooter } = useDoc(bottomFooterMenuRef);
  
  useEffect(() => { if (headerMenuData?.items) { setHeaderMenuItems(headerMenuData.items) } }, [headerMenuData]);
  useEffect(() => { if (topFooterMenuData?.items) { setTopFooterMenuItems(topFooterMenuData.items) } }, [topFooterMenuData]);
  useEffect(() => { if (bottomFooterMenuData?.items) { setBottomFooterMenuItems(bottomFooterMenuData.items) } }, [bottomFooterMenuData]);

  const handleAddToMenu = (menuSetter: React.Dispatch<React.SetStateAction<any[]>>, currentItems: any[]) => {
    const pagesToAdd = pages?.filter(p => checkedPages[p.id] && !currentItems.some(item => item.id === p.id)).map(p => ({
      id: p.id,
      label: p.name,
      href: p.id === 'home' ? '/' : `/${p.slug || p.id}`,
    })) || [];
    
    if (pagesToAdd.length > 0) {
      menuSetter(prev => [...prev, ...pagesToAdd]);
    }
    setCheckedPages({});
  };

  const createMoveItemHandler = (items: any[], setItems: React.Dispatch<React.SetStateAction<any[]>>) => (from: number, to: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
  };
  
  const createRemoveItemHandler = (setItems: React.Dispatch<React.SetStateAction<any[]>>) => (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSaveMenus = async () => {
      if (!firestore) return;
      setIsSaving(true);
      try {
        const batch = writeBatch(firestore);
        
        await saveMenuAction(batch, 'header', headerMenuItems);
        await saveMenuAction(batch, 'footer-top', topFooterMenuItems);
        await saveMenuAction(batch, 'footer-bottom', bottomFooterMenuItems);
        
        await batch.commit();

        toast({ title: 'Success', description: 'Menus have been saved successfully.' });
    } catch(e: any) {
      toast({ title: 'Error', description: 'Failed to save menus.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const isLoading = isLoadingPages || isLoadingHeader || isLoadingTopFooter || isLoadingBottomFooter;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-1 sticky top-20">
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
              <div className='flex flex-col gap-2 pt-4'>
                <Button size="sm" variant="outline" onClick={() => handleAddToMenu(setHeaderMenuItems, headerMenuItems)}>Add to Header</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddToMenu(setTopFooterMenuItems, topFooterMenuItems)}>Add to Top Footer</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddToMenu(setBottomFooterMenuItems, bottomFooterMenuItems)}>Add to Bottom Footer</Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <MenuBuilder 
                title="Header Menu" 
                items={headerMenuItems}
                setItems={setHeaderMenuItems}
                moveItem={createMoveItemHandler(headerMenuItems, setHeaderMenuItems)}
                onRemove={createRemoveItemHandler(setHeaderMenuItems)}
            />
             <MenuBuilder 
                title="Top Footer Menu" 
                items={topFooterMenuItems}
                setItems={setTopFooterMenuItems}
                moveItem={createMoveItemHandler(topFooterMenuItems, setTopFooterMenuItems)}
                onRemove={createRemoveItemHandler(setTopFooterMenuItems)}
            />
             <MenuBuilder 
                title="Bottom Footer Menu" 
                items={bottomFooterMenuItems}
                setItems={setBottomFooterMenuItems}
                moveItem={createMoveItemHandler(bottomFooterMenuItems, setBottomFooterMenuItems)}
                onRemove={createRemoveItemHandler(bottomFooterMenuItems)}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
