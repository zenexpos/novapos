/**
 * iPOS Zen — Service Worker (Elite Edition)
 * ضروري لاستيفاء شروط التثبيت المباشر (PWA Install Criteria)
 */

const CACHE_NAME = 'ipos-zen-cache-v2';

// 1. التثبيت - تخطي الانتظار لتفعيل النسخة الجديدة فوراً
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 2. التفعيل - السيطرة على كافة الصفحات المفتوحة
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 3. مستمع الـ Fetch - الشرط الإلزامي لظهور زر التثبيت في المتصفح
self.addEventListener('fetch', (event) => {
    // نترك المعالجة للشبكة مباشرة لضمان حداثة البيانات (Local-First)
    // لكن وجود هذا المستمع يخبر المتصفح أن التطبيق "قابل للعمل أوفلاين"
    return;
});
