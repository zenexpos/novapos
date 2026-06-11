'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    CalendarCheck, 
    Download, 
    Printer,
    FileSpreadsheet,
    Clock,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
    return (
        <div className="p-6 sm:p-4 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            <PageHeader 
                title="مركز التقارير التحليلي" 
                description="استخراج بيانات الذكاء التجاري والإغلاق المالي لليوم"
                icon={BarChart3}
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-primary/20 hover:bg-primary/5 gap-2 px-6">
                        <Printer className="h-4 w-4" /> طباعة الكل
                    </Button>
                    <Button className="rounded-xl h-11 shadow-xl gap-2 px-6">
                        <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'إغلاق اليوم (Z)', icon: CalendarCheck, color: 'bg-primary', desc: 'ملخص المبيعات النقدية والديون' },
                    { label: 'أداء الأصناف', icon: PieChart, color: 'bg-emerald-500', desc: 'المنتجات الأكثر ربحية ومبيعاً' },
                    { label: 'جرد المستودع', icon: Target, color: 'bg-amber-500', desc: 'قيمة المخزون الحالية وتوقعات النقص' },
                    { label: 'نشاط الديون', icon: TrendingUp, color: 'bg-blue-500', desc: 'حركة التحصيلات والديون الجديدة' }
                ].map((report, i) => (
                    <Card key={i} className="app-card group hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden border-white/5 bg-card/40 backdrop-blur-sm">
                        <CardHeader className="bg-muted/20 border-b border-white/5 p-4">
                            <div className="flex items-center justify-between">
                                <div className={cn("p-2.5 rounded-xl text-white shadow-lg", report.color)}>
                                    <report.icon className="h-5 w-5" />
                                </div>
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter opacity-40">Ready</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-primary transition-colors">{report.label}</h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{report.desc}</p>
                        </CardContent>
                        <div className="p-4 bg-muted/10 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground/40 flex items-center gap-1.5 uppercase">
                                <Clock className="h-3 w-3" /> تم التحديث الآن
                            </span>
                            <Download className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 app-card border-white/5 bg-card/40 backdrop-blur-sm">
                    <CardHeader className="p-6 border-b border-white/5 bg-muted/20">
                        <CardTitle className="text-xl font-bold tracking-tighter uppercase">سجل الإغلاقات التاريخي</CardTitle>
                        <CardDescription className="text-xs">قائمة بالتقارير المالية اليومية التي تم ختمها وإغلاقها.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                        <FileSpreadsheet className="h-16 w-16 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">لا توجد إغلاقات سابقة في هذا الجهاز</p>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 space-y-6">
                    <Card className="app-card border-white/5 bg-primary/5 shadow-xl">
                        <CardHeader className="p-6">
                            <Target className="h-10 w-10 text-primary mb-4" />
                            <CardTitle className="text-xl font-black tracking-tight">إغلاق وردية العمل</CardTitle>
                            <CardDescription className="text-xs font-medium leading-relaxed mt-2">
                                عند إغلاق الوردية، يقوم النظام بحساب إجمالي النقد الفعلي (Cash in Hand) ومقارنته بالمسجل في البرنامج لإخراج الفروقات الملحوظة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                                إنشاء تقرير إغلاق (Z)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
