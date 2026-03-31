# برنامج جرد الصناديق

نظام إدارة صناديق مالية لشركة الاعداد الراقي للتجارة والتزويد

## المتطلبات
- Node.js 20+
- قاعدة بيانات Neon PostgreSQL
- حساب Vercel للنشر

## خطوات الإعداد

### 1. استنساخ المشروع
```bash
git clone <repo-url>
cd Storage_System
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env.local
```
عدّل `.env.local` وأضف:
- `DATABASE_URL` — رابط Neon PostgreSQL
- `NEXTAUTH_SECRET` — سلسلة عشوائية (32 حرفاً على الأقل)
- `NEXTAUTH_URL` — رابط التطبيق (http://localhost:3000 للتطوير)

### 3. إنشاء جداول قاعدة البيانات
```bash
npm run db:push
```

### 4. إنشاء المستخدم الافتراضي
```bash
npm run seed
```
المستخدمون الافتراضيون:
- `admin` / `admin123` (مدير)
- `supervisor1` / `supervisor123` (مشرف)
- `cashier1` / `cashier123` (كاشير)

**تنبيه:** غيّر كلمات المرور فور تسجيل الدخول.

### 5. تشغيل التطبيق محلياً
```bash
npm run dev
```
افتح http://localhost:3000

## النشر على Vercel
```bash
vercel deploy
```
أضف متغيرات البيئة في لوحة تحكم Vercel.

## الأدوار والصلاحيات
| الدور | الصلاحيات |
|-------|-----------|
| مدير (admin) | كامل الصلاحيات |
| مشرف (supervisor) | عرض التقارير، اعتماد الجرد |
| كاشير (cashier) | إدخال الجرد الخاص به فقط |

## هيكل المشروع
```
src/
├── app/              # صفحات التطبيق (App Router)
├── components/       # مكونات واجهة المستخدم
├── db/               # مخطط قاعدة البيانات (Drizzle)
├── lib/              # مكتبات مساعدة
└── scripts/          # سكريبت الإعداد الأولي
```

## التقنيات المستخدمة
- Next.js 15 + TypeScript
- Neon PostgreSQL + Drizzle ORM
- NextAuth.js v5
- Tailwind CSS + shadcn/ui
- خط Tajawal العربي
