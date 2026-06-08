'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * RootPage — توجيه سيادي فوري.
 * يحل مشكلة الـ 404 عبر التوجيه المباشر في جهة العميل لمنع تعارض التصدير الاستاتيكي.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // توجيه صلب وفوري إلى لوحة التحكم
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-2xl border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
            iPOS Zen
          </p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
            Initialisation du registre...
          </p>
        </div>
      </div>
    </div>
  );
}
