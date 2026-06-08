'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * @fileOverview هوك التثبيت المباشر المطور.
 * يقوم بالتقاط حدث beforeinstallprompt وتخزينه لتمكين الزر الذهبي.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // منع الظهور إذا كان التطبيق مثبتاً بالفعل
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstallable(false);
            return;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية المزعجة للمتصفح
            e.preventDefault();
            // حفظ الحدث ليتم تفعيله يدوياً عبر زر "Installer iPOS"
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: iPOS Zen readiness detected.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // تنظيف عند فك المكون
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار نافذة التثبيت الرسمية للمتصفح
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: Install choice -> ${outcome}`);
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
