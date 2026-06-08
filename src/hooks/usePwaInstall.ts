'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك نخبوي لالتقاط حدث التثبيت المباشر.
 * يضمن ظهور زر التثبيت الذهبي في شريط التنقل.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية
            e.preventDefault();
            // حفظ الحدث لتشغيله عند الضغط على الزر الذهبي
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // إخفاء الزر إذا كان التطبيق مثبتاً بالفعل
        const checkStandalone = () => {
            if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
                setIsInstallable(false);
            }
        };

        checkStandalone();

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار واجهة تثبيت النظام
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
