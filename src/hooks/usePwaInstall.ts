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

    const checkStatus = useCallback(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstallable(false);
        } else if (deferredPrompt) {
            setIsInstallable(true);
        }
    }, []);

    useEffect(() => {
        checkStatus();

        const handleReady = () => setIsInstallable(true);
        const handleInstallTrigger = () => install();

        window.addEventListener('pwa-install-ready', handleReady);
        window.addEventListener('trigger-pwa-install', handleInstallTrigger);
        
        return () => {
            window.removeEventListener('pwa-install-ready', handleReady);
            window.removeEventListener('trigger-pwa-install', handleInstallTrigger);
        };
    }, [checkStatus]);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            deferredPrompt = null;
        }
    }, []);

    return { isInstallable, install };
}
