'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — نظام التقاط حدث التثبيت المتقدم.
 * يستخدم متغير عالمي لضمان التقاط الحدث حتى لو حدث قبل تحميل المكون.
 */

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        // منع الظهور التلقائي للمتصفح للتحكم فيه برمجياً
        e.preventDefault();
        deferredPrompt = e;
        // إرسال تنبيه لكافة المكونات المهتمة
        window.dispatchEvent(new Event('pwa-install-ready'));
    });
}

export function usePwaInstall() {
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                || (window.navigator as any).standalone === true;

            if (isStandalone) {
                setIsInstallable(false);
            } else if (deferredPrompt) {
                setIsInstallable(true);
            }
        };

        checkStatus();

        const handleReady = () => setIsInstallable(true);
        window.addEventListener('pwa-install-ready', handleReady);
        
        return () => window.removeEventListener('pwa-install-ready', handleReady);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) {
            // If the prompt is missing but we're on iOS, this won't work, but we can't trigger it anyway.
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            deferredPrompt = null;
        }
    }, []);

    return { isInstallable, install };
}