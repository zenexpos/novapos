'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك مطور لالتقاط حدث التثبيت المباشر.
 * تم تحسين المنطق لضمان التقاط الحدث حتى لو تأخر تحميل المكونات.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية الافتراضية
            e.preventDefault();
            // حفظ الحدث لتفعيله يدوياً عبر زر "Installer iPOS"
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: Install prompt captured and ready.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // التحقق من حالة التثبيت (إذا كان مفتوحاً كتطبيق بالفعل)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (typeof window !== 'undefined' && (window.navigator as any).standalone);
        
        if (isStandalone) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار نافذة التثبيت الأصلية للمتصفح
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
