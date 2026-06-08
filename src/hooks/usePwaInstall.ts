'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall — هوك نخبوي لإدارة عملية التثبيت المباشر.
 * يضمن التقاط حدث التثبيت وتوفير دالة تشغيل واجهة النظام الأصلية.
 */
export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // منع المتصفح من إظهار النافذة التلقائية المزعجة
            e.preventDefault();
            // حفظ الحدث لتشغيله يدوياً عند ضغط الزر الذهبي
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

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        // إظهار واجهة تثبيت النظام الأصلية (Native)
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    return { isInstallable, install };
}
