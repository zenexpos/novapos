'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, X } from 'lucide-react';
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

export function OcrInvoiceScanner({ onResult, disabled }: OcrInvoiceScannerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    ctx.filter = 'contrast(1.6) grayscale(1)';
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const processImage = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Format image requis.');
            return;
        }
        setIsProcessing(true);
        setProgress(5);
        try {
            const enhancedDataUrl = await enhanceImage(file);
            setPreview(enhancedDataUrl);
            const Tesseract = await import('tesseract.js');
            const { data } = await Tesseract.recognize(enhancedDataUrl, 'fra+ara', {
                logger: m => { if (m.status === 'recognizing text') setProgress(20 + (m.progress * 80)); }
            });
            const cleanedText = ocrParserService.cleanOcrText(data.text);
            const lines = cleanedText.split('\n').filter(l => l.trim().length > 3);
            onResult({ rawText: cleanedText, lines });
            toast.success("Analyse terminée.");
        } catch (err) {
            toast.error("Échec OCR.");
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
        <div className="space-y-1">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} disabled={isProcessing || disabled} />
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || disabled}
                className="h-10 rounded-xl px-4 gap-3 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all w-full relative overflow-hidden"
            >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <ScanLine className="h-4 w-4 text-primary" />}
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                    {isProcessing ? `SCAN ${Math.round(progress)}%` : 'SCANNER FACTURE (OCR)'}
                </span>
                {isProcessing && <div className="absolute bottom-0 left-0 h-0.5 bg-primary/30 transition-all" style={{ width: `${progress}%` }} />}
            </Button>

            {preview && !isProcessing && (
                <div className="relative h-12 rounded-lg border border-white/5 overflow-hidden bg-black/20 group">
                    <img src={preview} alt="Scan preview" className="w-full h-full object-cover opacity-20" />
                    <button onClick={() => setPreview(null)} className="absolute top-1 right-1 p-1 rounded-md bg-destructive text-white scale-75 hover:scale-90 transition-transform"><X className="h-3 w-3" /></button>
                </div>
            )}
        </div>
    );
}
