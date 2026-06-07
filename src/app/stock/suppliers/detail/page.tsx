'use client';

import SupplierDetailClient from './SupplierDetailClient';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function SupplierDetailFallback() {
    return (
        <div className="p-4 sm:p-5 space-y-5 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-96 rounded-2xl" />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<SupplierDetailFallback />}>
            <SupplierDetailClient />
        </Suspense>
    );
}
