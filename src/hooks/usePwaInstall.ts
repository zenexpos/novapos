'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك مطور لالتقاط حدث التثبيت.
 * تم تحسين المنطق لضمان عدم ضياع الحدث في تطبيقات SPA.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية الافتراضية للمتصفح
            e.preventDefault();
            // حفظ الحدث ليتم تفعيله عبر الزر المخصص
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: iPOS Zen is ready for direct installation.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // التحقق مما إذا كان التطبيق مثبتاً بالفعل
        const checkStatus = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                || (window.navigator as any).standalone;
            
            if (isStandalone) {
                setIsInstallable(false);
            }
        };

        checkStatus();

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار نافذة التثبيت الأصلية للنظام
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
