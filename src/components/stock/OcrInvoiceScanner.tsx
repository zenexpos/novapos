
'use client';
import React from 'react';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ocrParserService } from '@/services/ocr-parser.service';

interface OcrResult {
    rawText: string;
    lines: string[];
}

interface OcrInvoiceScannerProps {
    onResult: (result: OcrResult) => void;
    disabled?: boolean;
}

/**
 * Scanner de facture amélioré avec prétraitement d'image local.
 */
export function OcrInvoiceScanner({ onResult, disabled }: OcrInvoiceScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Prétraitement de l'image via Canvas : Grayscale + Contraste élevé.
     */
    const enhanceImage = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const contrast = 50; 
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const color = factor * (avg - 128) + 128;
                        data[i] = color;
                        data[i + 1] = color;
                        data[i + 2] = color;
                    }
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Format non supporté (Images uniquement).');
            return;
        }

        setIsProcessing(true);
        setProgress(10);
        
        try {
            const enhancedDataUrl = await enhanceImage(file);
            setPreview(enhancedDataUrl);
            setProgress(30);

            const Tesseract = await import('tesseract.js');
            const { data } = await Tesseract.recognize(enhancedDataUrl, 'fra+ara', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(30 + (m.progress * 70));
                    }
                }
            });

            const rawText = ocrParserService.cleanOcrText(data.text);
            const lines = rawText.split('\n').filter(l => l.trim().length > 3);

            onResult({ rawText, lines });
            toast.success(`Lecture terminée : ${lines.length} lignes identifiées.`);
        } catch (err) {
            console.error('OCR Error:', err);
            toast.error("Erreur lors de l'analyse. Vérifiez la netteté de l'image.");
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    }, [onResult]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    };

    return (
        <div className="space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing || disabled}
            />

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || disabled}
                    className="h-11 rounded-xl px-6 gap-3 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all flex-grow sm:flex-grow-0"
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                        <ScanLine className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isProcessing ? `Analyse ${Math.round(progress)}%` : 'Scanner Facture / BL'}
                    </span>
                </Button>

                {preview && !isProcessing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreview(null)}
                        className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {preview && (
                <div className="relative mt-2 rounded-2xl border border-white/5 overflow-hidden bg-black/20 shadow-inner group">
                    <img src={preview} alt="Scan preview" className="w-full h-32 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
