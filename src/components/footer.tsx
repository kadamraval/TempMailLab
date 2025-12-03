"use client";

import Link from "next/link";
import { Separator } from "./ui/separator";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

export function Footer() {
    const firestore = useFirestore();
    const headerMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'header') : null, [firestore]);
    const { data: headerMenuData } = useDoc(headerMenuRef);

    const footerMenuRef = useMemoFirebase(() => firestore ? doc(firestore, 'menus', 'footer') : null, [firestore]);
    const { data: footerMenuData } = useDoc(footerMenuRef);

    return (
        <footer className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <nav className="flex gap-6">
                    {(headerMenuData?.items || []).map((link: any) => (
                         <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                 </nav>
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                     &copy; {new Date().getFullYear()} Tempmailoz. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                     {(footerMenuData?.items || []).map((link: any) => (
                         <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

        </div>
      </footer>
    )
}
