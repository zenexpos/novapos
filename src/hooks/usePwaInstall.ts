'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — التقاط حدث التثبيت المباشر.
 * تم تحسين هذا الهوك لضمان عدم ضياع التنبيه في المتصفحات الحديثة.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // التحقق مما إذا كان التطبيق مثبتاً بالفعل
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstallable(false);
            return;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية المزعجة
            e.preventDefault();
            // تخزين الحدث ليتم استدعاؤه عند الضغط على زر التثبيت الذهبي
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: iPOS Zen is ready for direct installation.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
