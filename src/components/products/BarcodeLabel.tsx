'use client';

import React, { useRef, useEffect } from 'react';
import type { Product } from '@/lib/types';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
  product: Product;
}

export function BarcodeLabel({ product }: BarcodeLabelProps) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && product.barcodes && product.barcodes.length > 0) {
      try {
        JsBarcode(barcodeRef.current, product.barcodes[0], {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch (e) {
        console.error("Erreur de génération du code-barres:", e);
      }
    }
  }, [product.barcodes]);

  return (
    <div className="barcode-label p-2 border border-dashed border-black break-inside-avoid text-black bg-white">
      <p className="text-center font-bold text-sm truncate">{product.name}</p>
      <p className="text-center text-xs mb-1">Prix: <span className="font-bold">{Number(product.price || 0).toFixed(2)} DA</span></p>
      {product.barcodes && product.barcodes.length > 0 ? (
        <svg ref={barcodeRef} className="mx-auto max-w-full"></svg>
      ) : (
        <p className="text-center text-xs text-red-500 h-[40px] flex items-center justify-center font-bold uppercase">Sans Code</p>
      )}
    </div>
  );
}
