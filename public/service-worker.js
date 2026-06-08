/**
 * iPOS Zen — Service Worker (Elite Edition)
 * المحرك الأساسي لتفعيل ميزة التثبيت والعمل دون اتصال.
 */

const CACHE_NAME = 'ipos-zen-v2';

// 1. التثبيت والتفعيل الفوري
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 2. مستمع الـ fetch — الشرط الإلزامي لظهور زر التثبيت في المتصفحات
self.addEventListener('fetch', (event) => {
    // يسمح للمتصفح بالمرور المباشر للطلبات، وجود هذا المستمع كافٍ لاعتبار التطبيق Installable
    return;
});
