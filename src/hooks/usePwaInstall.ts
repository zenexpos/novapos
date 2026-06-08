'use client';

import { useState, useEffect } from 'react';

/**
 * usePwaInstall — هوك نخبوي لإدارة عملية التثبيت المباشر على سطح المكتب.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع المتصفح من إظهار النافذة التلقائية
            e.preventDefault();
            // حفظ الحدث لتشغيله عند ضغط الزر الذهبي
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // التحقق من حالة العرض (Standalone يعني أنه مثبت بالفعل)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;

        // إظهار واجهة تثبيت النظام الأصلية
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    };

    return { isInstallable, install };
}
