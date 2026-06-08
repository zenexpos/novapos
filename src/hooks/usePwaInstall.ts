'use client';

import { useState, useEffect } from 'react';

/**
 * usePwaInstall — هوك مخصص لإدارة عملية تثبيت التطبيق على سطح المكتب.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع المتصفح من إظهار النافذة الافتراضية
            e.preventDefault();
            // حفظ الحدث لاستخدامه لاحقاً
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // التحقق مما إذا كان التطبيق مثبتاً بالفعل
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;

        // إظهار نافذة التثبيت
        deferredPrompt.prompt();
        
        // انتظار رد فعل المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    };

    return { isInstallable, install };
}
