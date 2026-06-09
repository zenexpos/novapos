# iPOS Zen — Build Guide & Production Integrity

## الإصلاحات النهائية (مايو 2025)

### 🔴 نظام الـ PWA والتثبيت (مكتمل)
- إضافة `public/service-worker.js` اليدوي لتفعيل مستمع الـ `fetch`.
- تحديث `manifest.ts` مع اللقطات الإلزامية لظهور حوار التثبيت الغني.
- ضبط `next.config.js` لدعم `output: export` بانسجام مع المزامنة.

### 🟡 نظام الطباعة السيادي (مكتمل)
- **Monochrome A4**: إزالة الألوان وتصغير الخطوط لتوفير الحبر وضمان الاحترافية.
- **Centering**: توسيط الفاتورة تماماً في منتصف الورقة عبر قواعد CSS متقدمة.
- **Thermal 80mm**: تحسين الكثافة والمحاذاة باستخدام خطوط `Monospace`.

### 🟢 التوافق والأداء
- الترقية لـ React 19 و Next.js 15 (Turbopack).
- وضع نهاري (Light Mode) محسن بتباين عالي ونظام Glassmorphism نظيف.

---

## تشغيل البناء للإنتاج

```bash
npm run build        # يُنتج مجلد out/ جاهز للاستخدام
npm run electron:build # بناء ملف EXE للويندوز
```
