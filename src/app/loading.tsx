'use client';

import { ZenLoader } from '@/components/shared/loaders/ZenLoader';

/**
 * شاشة التحميل العالمية للنظام - iPOS Zen Loader
 * تظهر أثناء انتقال الصفحات أو تحميل البيانات الأولية.
 */
export default function RootLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <ZenLoader message="تحميل النظام السيادي..." fullScreen />
        </div>
    );
}
