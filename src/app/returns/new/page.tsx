'use client';

import { Suspense } from 'react';
import { NewReturnForm } from '@/components/returns/NewReturnForm';
import { PageHeader }    from '@/components/layout/PageHeader';
import { Button }        from '@/components/ui/button';
import { Skeleton }      from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ReturnFallback() {
    return (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
    );
}

export default function NewReturnPage() {
    return (
        <div className="p-2 sm:p-4 pb-24 space-y-4 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon-sm" asChild className="shrink-0 h-9 w-9 rounded-xl">
                    <Link href="/returns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black uppercase tracking-tighter leading-none">مرجع جديد</h1>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Régularisation des flux</p>
                </div>
            </div>
            <Suspense fallback={<ReturnFallback />}>
                <NewReturnForm />
            </Suspense>
        </div>
    );
}
