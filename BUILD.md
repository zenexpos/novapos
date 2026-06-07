# iPOS Zen — Build Guide

## إصلاحات هذا الإصدار (بناءً على تقرير التدقيق الشامل أبريل 2026)

### 🔴 إصلاحات حرجة (9/9 مكتملة)

| # | الملف | الإصلاح |
|---|---|---|
| 1 | `electron/main.js` | مسار الأيقونة → `icon-512x512.png` + IPC handler `open-external` المفقود |
| 2 | `package.json` | إضافة `electron ^29` + `electron-builder ^24` + scripts الـ desktop |
| 3 | `next.config.js` | حذف `ignoreBuildErrors` + `ignoreDuringBuilds` + `picsum.photos` |
| 4 | `tsconfig.json` | تفعيل `strictNullChecks` + `tsconfig` منفصل لـ electron |
| 5 | `public/service-worker.js` | offline-first حقيقي + `activate` cleanup + `skipWaiting` |
| 6 | `src/app/manifest.ts` | توحيد `theme_color` + أيقونات PNG + shortcuts + حذف `manifest.json` المكرر |
| 7 | `src/lib/db.ts` | migrations v1→v2→v3 كاملة + `createdAt` مفهرس + `&proformaNumber` فريد |
| 8 | `src/services/payment.service.ts` | transaction Dexie صحيحة تجمع الدفع + recalculate |
| 9 | `src/services/sales.service.ts` | `generateInvoiceNumber` داخل transaction — يمنع race condition |

### 🟡 إصلاحات تحذيرات (10/10 مكتملة)

| # | الملف | الإصلاح |
|---|---|---|
| 1 | `src/services/return.service.ts` | transaction كاملة في `addReturn` + تحقق كميات المرتجعات |
| 2 | `src/services/bread.service.ts` | transaction في `createDayOrders` لمنع race condition |
| 3 | `src/components/layout/AppSyncManager.tsx` | setInterval يعمل فقط عند تهيئة Supabase |
| 4 | `src/hooks/useLiveQuery.ts` | إضافة `error` + `isLoading` states |
| 5 | `src/components/sell/PaymentDialog.tsx` | منع إغلاق Dialog أثناء المعالجة + عرض الأخطاء |
| 6 | `src/components/sell/CartDisplay.tsx` | `min="0"` على حقل الكمية |
| 7 | `src/app/customers/page.tsx` | BOM UTF-8 لتصدير CSV |
| 8 | `src/app/products/page.tsx` | BOM UTF-8 لتصدير CSV |
| 9 | `src/app/settings/page.tsx` | `type="password"` لمفتاح Supabase + `localStorage` آمن |
| 10 | `tailwind.config.ts` | تبسيط `content` لـ `src/` فقط |

### 🗑️ ملفات محذوفة (6 ملفات مهجورة)

- `src/app/customers/[uuid]/CustomerDetailClient.tsx`
- `src/app/customers/[uuid]/page.tsx`
- `src/app/stock/suppliers/[uuid]/SupplierDetailClient.tsx`
- `src/app/stock/suppliers/[uuid]/page.tsx`
- `src/app/lib/placeholder-images.json`
- `public/manifest.json` (استُبدل بـ `src/app/manifest.ts`)

### ✅ ملفات مُطبَّقة جديداً

- `src/components/stock/OcrInvoiceScanner.tsx` — OCR حقيقي بـ Tesseract.js
- `electron/tsconfig.json` — إعداد TypeScript منفصل لـ Electron

---

## تشغيل المشروع

```bash
npm install
npm run dev          # وضع PWA
npm run electron:dev # وضع Desktop
npm run build        # بناء الإنتاج
npm run electron:build # بناء .exe/.deb
```
