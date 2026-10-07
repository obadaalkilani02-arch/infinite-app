# +Infinite — نسخة Beta 0.9.0-beta.1

## ما هو جاهز الآن
| المنصة | الحالة | الملف / الطريقة |
|---|---|---|
| Windows | ✅ جاهز | `release/Infinite-Setup-0.9.0-beta.1.exe` (مثبّت NSIS، غير موقَّع → قد تظهر شاشة SmartScreen: «مزيد من المعلومات ← تشغيل على أي حال») |
| ويب / PWA | ✅ جاهز للرفع | مجلد `dist/web/` (يُنشأ بالأمر `npm run build:web`) — يُرفع على أي استضافة ثابتة (GitHub Pages) فيصبح قابلاً للتثبيت على الهاتف («إضافة إلى الشاشة الرئيسية») ويعمل دون إنترنت |
| Android | ⏸ المشروع جاهز، البناء ينتظر SDK | مجلد `android/` (Capacitor، المعرّف `com.obada.infinite`). يحتاج JDK 17 (مثبّت) + Android SDK (لم يُنزَّل بقرارك) |

## إعادة البناء
```bash
npm run build:icons   # الأيقونات (platform/icons)
npm run build:web     # dist/web
npm run build:win     # release/Infinite-Setup-<version>.exe
```

## بناء Android (عند الموافقة على تنزيل SDK)
1. تثبيت Android SDK (platform 36 + build-tools 36.0.0) وضبط `ANDROID_HOME`
2. `npx cap sync android` ثم `cd android && gradlew bundleRelease` (AAB للمتجر) أو `gradlew assembleDebug` (APK للتجربة)
3. توقيع الإصدار بمفتاح keystore خاص (احفظه في مكانين — فقدانه يمنع تحديث التطبيق؛ الملفات `*.jks` و`keystore.properties` مستثناة من git)

## توزيع Beta على المختبرين
- **أسرع طريق:** PWA على GitHub Pages — رابط واحد يعمل على Android وiOS وWindows.
- **Google Play (اختبار مغلق):** يحتاج حساب مطوّر (25$) + AAB موقَّع + 12 مختبِرًا لمدة 14 يومًا قبل النشر العام.
- **Windows:** أرسل ملف المثبّت مباشرة، أو انشر عبر Microsoft Store (MSIX) لاحقًا.

## قبل الإصدار النهائي (لم يُنجَز بعد)
- سياسة الخصوصية (التطبيق يعمل دون اتصال ولا يجمع بيانات) — مسودة في `PRIVACY.md`
- لقطات شاشة للمتاجر ووصف عربي/إنجليزي
- توقيع المثبّت (اختياري) واختبار على جهاز Windows نظيف وهاتف Android حقيقي
- تأكيد معرّف الحزمة `com.obada.infinite` قبل أول رفع (لا يمكن تغييره بعده)
