'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك مطور لالتقاط حدث التثبيت المباشر.
 * تم تحسين المنطق لضمان التقاط الحدث والاحتفاظ به حتى لو تأخر تحميل الواجهة.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // التحقق من حالة التثبيت الحالية
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (typeof window !== 'undefined' && (window.navigator as any).standalone);

        if (isStandalone) {
            setIsInstallable(false);
            return;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية الافتراضية للمتصفح
            e.preventDefault();
            // تخزين الحدث ليتم استخدامه عند النقر على الزر الذهبي
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: Install prompt detected and ready for user action.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // تنظيف عند الخروج
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) {
            console.warn('PWA: No install prompt deferred.');
            return;
        }

        // إظهار نافذة التثبيت الأصلية للمتصفح
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: User ${outcome} the install prompt`);
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
