import { redirect } from 'next/navigation';

/**
 * RootPage — توجيه سيادي فوري.
 * يحل مشكلة الـ 404 في وضع التصدير الاستاتيكي عبر توجيه الخادم المباشر.
 */
export default function RootPage() {
    redirect('/dashboard');
}
