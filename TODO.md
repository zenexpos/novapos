# TODO - تحويل التطبيق إلى Windows EXE

- [x] فحص/قراءة package.json وإعدادات electron-builder الحالية (بدون تعديل ملفات)
- [x] تعديل package.json لإضافة build config لـ electron-builder لإخراج nsis EXE على win x64
- [x] التأكد أن ملفات Electron المطلوبة يتم تضمينها (electron/main.js, preload.js, out/**)

- [ ] تشغيل: npm install
- [ ] تشغيل: npm run electron:build
- [ ] التحقق من وجود EXE داخل مجلد dist/ (أو المسار الذي يحدده electron-builder)
- [ ] إن فشل البناء، قراءة سجل الخطأ وتعديل build/files/out configuration وفقًا للخطأ

