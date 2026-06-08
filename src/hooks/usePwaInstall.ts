'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * @fileOverview هوك التثبيت المباشر — يلتقط حدث beforeinstallprompt.
 * هذا الحدث لا يطلق إلا بوجود Service Worker مسجل وفعال.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // التحقق من حالة التثبيت الحالية (إذا كان مثبتاً بالفعل لا تظهر الزر)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstallable(false);
            return;
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية
            e.preventDefault();
            // حفظ الحدث للاستخدام عند النقر على الزر الذهبي
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('PWA: iPOS Zen is ready for installation.');
        };

        // الاستماع للحدث
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // التحقق من الجاهزية فور التحميل (في حال أطلق الحدث بسرعة)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار نافذة التثبيت
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: Install outcome -> ${outcome}`);
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
