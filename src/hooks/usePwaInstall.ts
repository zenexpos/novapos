'use client';

import { useState, useEffect } from 'react';

/**
 * Hook لإدارة عملية تثبيت التطبيق (PWA).
 * يستمع لحدث beforeinstallprompt ويوفر وظيفة التثبيت.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // منع المتصفح من إظهار الواجهة الافتراضية
            e.preventDefault();
            // تخزين الحدث لاستخدامه لاحقاً
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // التحقق مما إذا كان التطبيق مثبتاً بالفعل
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;

        // إظهار واجهة التثبيت
        deferredPrompt.prompt();

        // انتظار رد فعل المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        
        setDeferredPrompt(null);
    };

    return { isInstallable, install };
}
