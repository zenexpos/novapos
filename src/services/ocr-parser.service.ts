'use client';

import { safeNumber } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { productService } from './product.service';

/**
 * @fileOverview محرك التحليل السيمانتيكي لنتائج OCR.
 * يستخرج المنتجات والأسعار والكميات والموردين بذكاء.
 */
class OcrParserService {
    // الكلمات الدلالية للأعمدة (بالعربية والفرنسية)
    private readonly keywords = {
        quantity: ['qte', 'quantité', 'quantite', 'qty', 'الكمية', 'الكميه', 'عد'],
        price: ['pu', 'p.u', 'prix', 'unitaire', 'achat', 'السعر', 'سعر', 'ثمن'],
        total: ['total', 'montant', 'ttc', 'ht', 'الإجمالي', 'الاجمالي', 'المجموع', 'مبلغ'],
        designation: ['produit', 'désignation', 'designation', 'article', 'item', 'المنتج', 'الصنف', 'المادة', 'التعيين']
    };

    /**
     * محاولة اكتشاف المورد من النص الخام.
     */
    detectSupplier(text: string): string | null {
        // المورد غالباً ما يكون في السطور الثلاثة الأولى أو بعد كلمات "مؤسسة" أو "شركة"
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
        const supplierKeywords = ['شركة', 'مؤسسة', 'EURL', 'SARL', 'ETS', 'ETS.', 'GROUPE'];
        
        for (const line of lines.slice(0, 5)) {
            if (supplierKeywords.some(kw => line.toUpperCase().includes(kw))) {
                return line;
            }
        }
        return lines[0] || null;
    }

    /**
     * تحليل السطور لاستخراج كائنات المنتجات.
     */
    async parseInvoiceLines(lines: string[]): Promise<any[]> {
        const extractedItems: any[] = [];
        const products = await productService.getProducts();

        for (const line of lines) {
            const cleanLine = this.cleanOcrText(line).trim().replace(/,/g, '.');
            
            // البحث عن مجموعات الأرقام
            const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);
            
            if (numbers && numbers.length >= 1) {
                // استخراج الاسم (كل ما ليس رقماً أو رمزاً مالياً)
                const namePart = cleanLine.replace(/[\d.,]/g, '').replace(/[€$£]/g, '').trim();
                
                if (namePart.length > 2) {
                    const qty = safeNumber(numbers[0]);
                    const price = numbers.length > 1 ? safeNumber(numbers[1]) : 0;
                    
                    const match = this.findBestMatch(namePart, products);
                    
                    extractedItems.push({
                        name: match ? match.name : namePart,
                        productUuid: match ? match.uuid : undefined,
                        quantity: qty > 0 ? qty : 1,
                        purchasePrice: price > 0 ? price : (match ? match.purchasePrice : 0),
                        price: match ? match.price : 0,
                        isNew: !match,
                        confidence: match ? 0.95 : 0.45
                    });
                }
            }
        }

        return extractedItems;
    }

    private findBestMatch(name: string, products: Product[]): Product | null {
        const searchName = name.toLowerCase();
        const exact = products.find(p => p.name.toLowerCase() === searchName);
        if (exact) return exact;

        const partial = products.find(p => 
            p.name.toLowerCase().includes(searchName) || 
            searchName.includes(p.name.toLowerCase())
        );
        
        return partial || null;
    }

    cleanOcrText(text: string): string {
        return text
            .replace(/\bO\b/g, '0')
            .replace(/[l|I]/g, '1')
            .replace(/[S]/g, '5')
            .replace(/[Z]/g, '2')
            .replace(/[B]/g, '8')
            .replace(/[?]/g, '7')
            .trim();
    }
}

export const ocrParserService = new OcrParserService();
