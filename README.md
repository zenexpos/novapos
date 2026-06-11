# iPOS Zen — Sovereign Ledger & Elite POS

**iPOS Zen** هو نظام نقطة بيع (POS) سيادي وفاخر، مصمم ليعمل بالكامل داخل المتصفح وبفلسفة **العمل دون اتصال أولاً (Offline-First)**. يوفر النظام تجربة مستخدم "Zen" فائقة السرعة مع خصوصية مطلقة للبيانات.

## 🏗 هيكل المشروع (Detailed Trunk)

النظام مبني على معايير هندسية متقدمة لضمان القابلية للتوسع والأداء العالي:

### 1. `src/services/` (Business Logic)
- **Domain Driven:** تقسيم الخدمات حسب النطاق (Sales, Inventory, Finance).
- **Service Layer:** فصل منطق الأعمال عن واجهة المستخدم لسهولة الاختبار والصيانة.

### 2. `src/stores/` (State Management)
- **Atomic State:** استخدام Zustand لتقسيم الحالة إلى متاجر صغيرة (Atomic) لتقليل عمليات إعادة الرندر (Re-renders) وزيادة السرعة.
- **Persistence:** حفظ الحالة تلقائياً في التخزين المحلي لضمان استمرارية العمل.

### 3. `src/lib/` (Core Utilities)
- **Math Engine:** محرك حسابات مالية مخصص يعالج مشاكل الفواصل العشرية (Floating Point) بدقة محاسبية.
- **Database Layer:** محرك Dexie.js لإدارة IndexedDB مع Schema منظم يدعم المزامنة السحابية.

### 4. `public/` (Fortress Offline)
- **PWA Assets:** نظام أيقونات ومانيفست متطور يدعم التثبيت على كافة أنظمة التشغيل.
- **Zen Fallback:** صفحة Offline مخصصة تضمن بقاء المستخدم داخل بيئة التطبيق حتى عند الانهيار التام للشبكة.

### 5. `electron/` (Native Desktop)
- **Hardware Bridge:** التواصل المباشر مع الطابعات الحرارية ودرج النقد عبر منافذ USB/Serial.
- **Security Policy:** سياسات أمان صارمة (CSP) لعزل واجهة الويب عن عمليات النظام الحساسة.

## 🛠 التكنولوجيا المستخدمة

*   **Framework :** Next.js 15 (React 19) — وضع التصدير الثابت (Static Export).
*   **Database :** IndexedDB (via Dexie.js) — تخزين محلي فائق السرعة.
*   **UI Engine :** Tailwind CSS v4 & ShadCN UI — واجهة مصممة لشاشات الـ POS.
*   **Sync :** Titanium Sync Engine — مزامنة ذكية مع Supabase.

## 💻 التوافق والأداء
تم تصميم الواجهة بعناية لتناسب أطراف البيع القياسية (دقة 1360x768)، مع التركيز على كثافة البيانات وتقليل الحاجة للتمرير (Zero-Scroll Policy) لضمان رؤية شاملة للعملية التجارية.
