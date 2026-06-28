'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Skeleton لجدول استلامات المخزون لضمان تجربة مستخدم سلسة أثناء التحميل.
 */
export function StockIntakeTableSkeleton() {
    return (
        <div className="rounded-lg border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                        <TableHead className="p-6 w-[250px]"><Skeleton className="h-4 w-32" /></TableHead>
                        <TableHead className="p-6"><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="p-6 text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableHead>
                        <TableHead className="p-6 text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
                        <TableHead className="p-6 text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableHead>
                        <TableHead className="p-6 w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i} className="border-b border-white/5">
                            <TableCell className="p-6"><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="p-6"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="p-6 text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                            <TableCell className="p-6 text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                            <TableCell className="p-6 text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                            <TableCell className="p-6 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
