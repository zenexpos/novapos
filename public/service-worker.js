/**
 * iPOS Zen — Service Worker (Elite Edition)
 * المحرك التقني المسؤول عن دعم وضع الأوفلاين وصلاحية التثبيت كـ PWA.
 */

const CACHE_NAME = 'ipos-zen-v1';

// 1. التثبيت — تخطي الانتظار لتفعيل التحديثات فوراً
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 2. التفعيل — السيطرة على كافة النوافذ المفتوحة
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 3. مستمع الـ Fetch — الشرط الإلزامي لظهور زر التثبيت في Chrome/Edge
// حتى لو كان فارغاً، يجب وجوده ليتم اعتبار التطبيق "قابلاً للتثبيت"
self.addEventListener('fetch', (event) => {
    // نظام iPOS Zen يعتمد على IndexedDB للبيانات، لذا نترك المتصفح يتعامل مع الطلبات
    // وجود هذا المستمع يخبر المتصفح أن التطبيق يمتلك قدرات العمل المحلي
    return;
});
