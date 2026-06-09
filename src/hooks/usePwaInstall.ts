'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — نظام التقاط حدث التثبيت المتقدم iPOS Zen.
 * يستخدم مستمعاً عالمياً لضمان عدم ضياع الحدث 'beforeinstallprompt'
 * الذي يرسله المتصفح لتفعيل زر التثبيت.
 */

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        // منع الظهور التلقائي للمتصفح للتحكم فيه برمجياً عبر أزرارنا الخاصة
        e.preventDefault();
        deferredPrompt = e;
        // إرسال تنبيه لكافة المكونات المهتمة بأن التطبيق جاهز للتثبيت
        window.dispatchEvent(new Event('pwa-install-ready'));
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        window.dispatchEvent(new Event('pwa-installed'));
    });
}

export function usePwaInstall() {
    const [isInstallable, setIsInstallable] = useState(false);

    const checkStatus = useCallback(() => {
        if (typeof window === 'undefined') return;

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
        const handleInstalled = () => setIsInstallable(false);
        const handleInstallTrigger = () => install();

        window.addEventListener('pwa-install-ready', handleReady);
        window.addEventListener('pwa-installed', handleInstalled);
        window.addEventListener('trigger-pwa-install', handleInstallTrigger);
        
        return () => {
            window.removeEventListener('pwa-install-ready', handleReady);
            window.removeEventListener('pwa-installed', handleInstalled);
            window.removeEventListener('trigger-pwa-install', handleInstallTrigger);
        };
    }, [checkStatus]);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                setIsInstallable(false);
                deferredPrompt = null;
            }
        } catch (err) {
            console.error('[PWA] Error during install:', err);
        }
    }, []);

    return { isInstallable, install };
}
