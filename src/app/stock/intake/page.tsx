'use client';

import { Suspense } from 'react';
import { NewIntakeForm } from '@/components/stock/NewIntakeForm';
import { PageHeader }    from '@/components/layout/PageHeader';
import { Button }        from '@/components/ui/button';
import { Skeleton }      from '@/components/ui/skeleton';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import Link from 'next/link';

function IntakeFallback() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );
}

export default function NewIntakePage() {
    return (
        <div className="p-2 sm:p-3 pb-24 space-y-2 max-w-[1800px] mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" asChild className="shrink-0">
                    <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <PageHeader
                    title="Réception"
                    description="Flux entrants & Coût de revient"
                    className="mb-0"
                />
            </div>
            <Suspense fallback={<IntakeFallback />}>
                <NewIntakeForm />
            </Suspense>
        </div>
    );
}
