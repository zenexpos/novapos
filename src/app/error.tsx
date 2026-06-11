'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[iPOS Zen Critical Error]:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in zoom-in-95 duration-500">
            <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 mb-8">
                <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground mb-2">خطأ في النظام</h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8 leading-relaxed">
                حدث خطأ غير متوقع في محرك البيانات. لا تقلق، بياناتك المحلية محفوظة بأمان في المتصفح.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" size="lg" onClick={() => reset()} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 border-primary/20 hover:bg-primary/5">
                    <RefreshCcw className="h-5 w-5" />
                    إعادة المحاولة
                </Button>
                <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-xl">
                    <Link href="/">
                        <Home className="h-5 w-5" />
                        لوحة التحكم
                    </Link>
                </Button>
            </div>
        </div>
    );
}
