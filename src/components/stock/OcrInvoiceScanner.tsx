'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ocrParserService } from '@/services/ocr-parser.service';
import { Progress } from '@/components/ui/progress';

interface OcrResult {
    rawText: string;
    lines: string[];
}

interface OcrInvoiceScannerProps {
    onResult: (result: OcrResult) => void;
    disabled?: boolean;
}

/**
 * Scanner de facture amélioré avec prétraitement d'image local via Canvas.
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
                    
                    // Appliquer un filtre de contraste et de gris
                    ctx.filter = 'contrast(1.5) grayscale(1)';
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
            toast.error('Format non supporté (Images uniquement).');
            return;
        }

        setIsProcessing(true);
        setProgress(5);
        
        try {
            // 1. Amélioration locale
            const enhancedDataUrl = await enhanceImage(file);
            setPreview(enhancedDataUrl);
            setProgress(20);

            // 2. Reconnaissance OCR
            const Tesseract = await import('tesseract.js');
            const { data } = await Tesseract.recognize(enhancedDataUrl, 'fra+ara', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(20 + (m.progress * 80));
                    }
                }
            });

            // 3. Nettoyage et structuration
            const cleanedText = ocrParserService.cleanOcrText(data.text);
            const lines = cleanedText.split('\n').filter(l => l.trim().length > 3);

            onResult({ rawText: cleanedText, lines });
            toast.success(`Lecture Elite terminée : ${lines.length} lignes structurables.`);
        } catch (err) {
            console.error('OCR Error:', err);
            toast.error("Échec de l'analyse OCR. Assurez-vous que l'image est nette.");
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

            <div className="flex flex-col gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || disabled}
                    className="h-14 rounded-2xl px-6 gap-3 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all w-full relative overflow-hidden group"
                >
                    {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                        <ScanLine className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <div className="flex flex-col items-start text-left">
                        <span className="text-xs font-black uppercase tracking-widest">
                            {isProcessing ? `Traitement Elite ${Math.round(progress)}%` : 'Scanner Facture / BL'}
                        </span>
                        {!isProcessing && <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Extraction intelligente bilingue</span>}
                    </div>
                    {isProcessing && (
                        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-300" style={{ width: `${progress}%` }} />
                    )}
                </Button>

                {preview && (
                    <div className="relative mt-2 rounded-2xl border border-white/5 overflow-hidden bg-black/20 shadow-inner group h-32">
                        <img src={preview} alt="Scan preview" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {!isProcessing && (
                            <button 
                                onClick={() => setPreview(null)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive text-white shadow-lg hover:scale-110 transition-transform"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        
                        <div className="absolute bottom-3 left-4 flex items-center gap-2">
                            <ImageIcon className="h-3 w-3 text-white/40" />
                            <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Aperçu du traitement</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
