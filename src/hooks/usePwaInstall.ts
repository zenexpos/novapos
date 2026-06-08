'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك نخبوي لالتقاط حدث التثبيت المباشر.
 * تم تحسين المنطق لضمان عدم ضياع الحدث عند إعادة التحميل.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع النافذة التلقائية الافتراضية
            e.preventDefault();
            // حفظ الحدث لتشغيله يدوياً عبر زر التثبيت
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('iPOS Zen is ready for direct installation.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // إخفاء الزر إذا كان التطبيق مثبتاً بالفعل (Standalone Mode)
        const checkStatus = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                || (window.navigator as any).standalone 
                || document.referrer.includes('android-app://');
            
            if (isStandalone) {
                setIsInstallable(false);
            }
        };

        checkStatus();

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار واجهة تثبيت النظام الأصلية
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install: ${outcome}`);
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
