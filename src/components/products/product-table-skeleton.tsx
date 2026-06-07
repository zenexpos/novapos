'use client';

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProductTableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] px-4">
                            <Skeleton className="h-5 w-5" />
                        </TableHead>
                        <TableHead>Nom du Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Prix d'Achat</TableHead>
                        <TableHead className="text-right">Prix de Vente</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                               <Skeleton className="h-5 w-5" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-48" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-20 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-20 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-8 w-8 ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
