import { redirect } from 'next/navigation';

/**
 * الصفحة الجذرية - توجيه سيادي صلب.
 * يستخدم redirect() على جانب الخادم لضمان أفضل توافق مع Next.js 15 
 * وتجنب أخطاء 404 أثناء التحميل الأولي في وضع التصدير الاستاتيكي.
 */
export default function RootPage() {
  redirect('/dashboard/');
}
