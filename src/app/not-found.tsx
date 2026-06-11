'use client';

import { Button } from '@/components/ui/button';
import { Home, SearchX } from 'lucide-react';
import Link from 'next/link';

/**
 * Page 404 standardisée.
 */
export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
            <div className="p-8 rounded-full bg-muted/20 border border-dashed border-border mb-8">
                <SearchX className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground mb-2">Page Introuvable</h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                La ressource demandée n'existe pas ou a été déplacée.
            </p>
            <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-xl">
                <Link href="/">
                    <Home className="h-5 w-5" />
                    Tableau de bord
                </Link>
            </Button>
        </div>
    );
}
