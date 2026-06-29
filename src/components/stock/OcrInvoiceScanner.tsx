'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2, X, Image as ImageIcon, Sparkles, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ocrParserService } from '@/services/ocr-parser.service';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
            const enhancedDataUrl = await enhanceImage(file);
            setPreview(enhancedDataUrl);
            setProgress(20);

            const Tesseract = await import('tesseract.js');
            const { data } = await Tesseract.recognize(enhancedDataUrl, 'fra+ara', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(20 + (m.progress * 80));
                    }
                }
            });

            const cleanedText = ocrParserService.cleanOcrText(data.text);
            const lines = cleanedText.split('\n').filter(l => l.trim().length > 3);

            onResult({ rawText: cleanedText, lines });
            toast.success(`Lecture terminée : ${lines.length} lignes identifiées.`);
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
                    className="h-16 rounded-2xl px-6 gap-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all w-full relative overflow-hidden group"
                >
                    {isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                        <ScanLine className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <div className="flex flex-col items-start text-left flex-grow">
                        <span className="text-xs font-black uppercase tracking-widest">
                            {isProcessing ? `Lecture intelligente ${Math.round(progress)}%` : 'Scanner une facture / BL'}
                        </span>
                        {!isProcessing && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Extraction automatique bilingue</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3 w-3 text-primary/30" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Prenez une photo nette de votre facture d'achat pour remplir automatiquement la liste des articles.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>
                    {isProcessing && (
                        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-300" style={{ width: `${progress}%` }} />
                    )}
                </Button>

                {preview && (
                    <div className="relative mt-2 rounded-2xl border border-white/5 overflow-hidden bg-black/20 shadow-inner group h-32 animate-in slide-in-from-top-2">
                        <img src={preview} alt="Scan preview" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {!isProcessing && (
                            <button 
                                onClick={() => setPreview(null)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive text-white shadow-lg hover:scale-110 transition-transform"
                                title="Supprimer l'aperçu"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        
                        <div className="absolute bottom-3 left-4 flex items-center gap-2">
                            <ImageIcon className="h-3 w-3 text-white/40" />
                            <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Aperçu du scan en cours</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}