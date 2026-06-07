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
        <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
    );
}

export default function NewIntakePage() {
    return (
        <div className="p-4 sm:p-5 pb-24 space-y-4 max-w-[1800px] mx-auto animate-page-enter">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    className="shrink-0"
                >
                    <Link href="/stock">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title="Réception Marchandise"
                    description="Enregistrement des flux entrants et ajustement automatique du coût de revient"
                    icon={PackagePlus}
                />
            </div>
            <Suspense fallback={<IntakeFallback />}>
                <NewIntakeForm />
            </Suspense>
        </div>
    );
}
