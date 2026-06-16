
'use client';

import { safeNumber } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { productService } from './product.service';

/**
 * Service d'analyse sémantique pour les résultats OCR.
 * Capable de détecter les structures de factures et les colonnes de prix/quantité.
 */
class OcrParserService {
    // Mots-clés pour la détection de colonnes (Français & Arabe)
    private readonly keywords = {
        quantity: ['qte', 'quantité', 'quantite', 'qty', 'الكمية', 'الكميه'],
        price: ['pu', 'p.u', 'prix', 'unitaire', 'achat', 'السعر', 'سعر'],
        total: ['total', 'montant', 'ttc', 'ht', 'الإجمالي', 'الاجمالي', 'المجموع'],
        designation: ['produit', 'désignation', 'designation', 'article', 'item', 'المنتج', 'الصنف']
    };

    /**
     * Analyse les lignes brutes pour extraire des objets produits structurés.
     */
    async parseInvoiceLines(lines: string[]): Promise<any[]> {
        const extractedItems: any[] = [];
        const products = await productService.getProducts();

        for (const line of lines) {
            // Nettoyage de la ligne
            const cleanLine = line.trim().replace(/[,]/g, '.');
            
            // Tentative d'extraction : Nom + Quantité + Prix
            // Format type: "NOM PRODUIT 10 150.00" ou "10 NOM PRODUIT 1500"
            const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);
            
            if (numbers && numbers.length >= 1) {
                // On cherche le nom (tout ce qui n'est pas un chiffre pur)
                const namePart = cleanLine.replace(/[\d.]/g, '').trim();
                
                if (namePart.length > 2) {
                    const qty = safeNumber(numbers[0]);
                    const price = numbers.length > 1 ? safeNumber(numbers[1]) : 0;
                    
                    // Recherche d'un match dans la base
                    const match = this.findBestMatch(namePart, products);
                    
                    extractedItems.push({
                        name: match ? match.name : namePart,
                        productUuid: match ? match.uuid : undefined,
                        quantity: qty,
                        purchasePrice: price > 0 ? price : (match ? match.purchasePrice : 0),
                        price: match ? match.price : 0,
                        isNew: !match,
                        confidence: match ? 0.9 : 0.4
                    });
                }
            }
        }

        return extractedItems;
    }

    /**
     * Recherche floue simple pour faire correspondre le texte OCR avec la DB.
     */
    private findBestMatch(name: string, products: Product[]): Product | null {
        const searchName = name.toLowerCase();
        
        // 1. Match exact
        const exact = products.find(p => p.name.toLowerCase() === searchName);
        if (exact) return exact;

        // 2. Contient (Fuzzy léger)
        const partial = products.find(p => 
            p.name.toLowerCase().includes(searchName) || 
            searchName.includes(p.name.toLowerCase())
        );
        
        return partial || null;
    }

    /**
     * Tente de corriger les erreurs de lecture classiques du moteur OCR.
     */
    cleanOcrText(text: string): string {
        return text
            .replace(/[O]/g, '0') // O -> 0
            .replace(/[I|l]/g, '1') // I, l -> 1
            .replace(/[S]/g, '5') // S -> 5
            .replace(/[Z]/g, '2') // Z -> 2
            .trim();
    }
}

export const ocrParserService = new OcrParserService();
