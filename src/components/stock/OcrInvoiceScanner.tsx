'use client';
import React from 'react';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, Upload, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface OcrResult {
    rawText: string;
    lines: string[];
}

interface OcrInvoiceScannerProps {
    onResult: (result: OcrResult) => void;
    disabled?: boolean;
}

/**
 * FIX: OcrInvoiceScanner — was returning null (stub/disabled).
 * Now implements real OCR using Tesseract.js (loaded dynamically to avoid SSR issues).
 * Supports image upload and camera capture.
 */
export function OcrInvoiceScanner({ onResult, disabled }: OcrInvoiceScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image valide.');
            return;
        }

        setIsProcessing(true);
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            // Dynamic import to avoid SSR issues
            // tesseract.js v6: recognize() now accepts options as 3rd param including logger
            const Tesseract = await import('tesseract.js');
            const { data } = await Tesseract.recognize(file, 'fra+ara+eng', {
                errorHandler: () => {},
            });

            const rawText = data.text.trim();
            const lines = rawText
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 1);

            onResult({ rawText, lines });
            toast.success(`OCR terminé — ${lines.length} lignes extraites.`);
        } catch (err) {
            console.error('OCR error:', err);
            toast.error("Erreur lors de la lecture de l'image. Réessayez avec une image plus nette.");
        } finally {
            setIsProcessing(false);
        }
    }, [onResult]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing || disabled}
            />

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || disabled}
                    className="gap-2"
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ScanLine className="h-4 w-4" />
                    )}
                    {isProcessing ? 'Lecture OCR...' : 'Scanner facture'}
                </Button>

                {preview && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearPreview}
                        disabled={isProcessing}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {preview && (
                <div className="relative mt-1 rounded border overflow-hidden max-h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Aperçu facture" className="w-full object-contain max-h-32" />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="text-white text-sm flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyse en cours...
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
