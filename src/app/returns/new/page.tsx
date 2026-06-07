'use client';

import { Suspense } from 'react';
import { NewReturnForm } from '@/components/returns/NewReturnForm';
import { PageHeader }    from '@/components/layout/PageHeader';
import { Button }        from '@/components/ui/button';
import { Skeleton }      from '@/components/ui/skeleton';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

function ReturnFallback() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
    );
}

export default function NewReturnPage() {
    return (
        <div className="p-4 sm:p-5 pb-24 space-y-4 max-w-[1400px] mx-auto animate-page-enter">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon-sm" asChild className="shrink-0">
                    <Link href="/returns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title="Nouveau Retour"
                    description="Traitement des retours marchandise et rééquilibrage des créances"
                    icon={RotateCcw}
                />
            </div>
            <Suspense fallback={<ReturnFallback />}>
                <NewReturnForm />
            </Suspense>
        </div>
    );
}
