'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCartActions } from '@/stores/cartStore';
import { productService } from '@/services/product.service';
import { v4 as uuidv4 } from 'uuid';

interface CustomItemDialogProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Fenêtre d'ajout d'article personnalisé (manuel).
 * Architecture corrigée : utilise productService pour l'instanciation de l'entité.
 */
export function CustomItemDialog({ children, isOpen: controlledOpen, onOpenChange: setControlledOpen }: CustomItemDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = (val: boolean) => {
        if (setControlledOpen) setControlledOpen(val);
        else setInternalOpen(val);
    };

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addItemToCart } = useCartActions();

    useEffect(() => {
        if (isOpen) {
            setName('');
            setPrice('');
        }
    }, [isOpen]);

    const handleAdd = () => {
        const priceNum = parseFloat(price);
        if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
            toast.error("Veuillez entrer un nom et un prix valide.");
            return;
        }

        setIsLoading(true);

        // ARCHITECTURE FIX: Delegation de la creation de l'entité à la Factory Service
        const customProduct = productService.createProductEntity({
            name: name.trim(),
            price: priceNum,
            purchasePrice: 0,
            quantity: 999999, // Virtuel : stock illimité pour le panier
            category: 'Personnalisé',
            unite: 'Pièce',
        }, `custom-${uuidv4()}`);

        addItemToCart(customProduct);
        
        toast.success(`"${name.trim()}" ajouté au panier.`);
        setIsLoading(false);
        setIsOpen(false); 
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-sm bg-card">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Article Personnalisé</DialogTitle>
                    <DialogDescription className="text-xs font-medium">
                       Ajout d'un flux manuel hors catalogue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="custom-name" className="text-[10px] font-bold uppercase ml-1 opacity-40">Désignation</Label>
                        <Input 
                            id="custom-name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            autoFocus 
                            placeholder="Ex: Service de livraison, Réparation..."
                            className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-bold"
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); (document.getElementById('custom-price') as HTMLInputElement)?.focus(); } }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-price" className="text-[10px] font-bold uppercase ml-1 opacity-40">Prix de vente (DA)</Label>
                        <div className="relative">
                            <Input 
                                id="custom-price" 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                onKeyDown={(e) => { if(e.key === 'Enter') handleAdd() }} 
                                className="h-12 rounded-xl bg-muted/30 border-none shadow-inner font-black text-lg text-primary text-center"
                                placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs opacity-20 uppercase">DA</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl h-12 font-bold flex-1" disabled={isLoading}>Annuler</Button>
                    <Button onClick={handleAdd} disabled={isLoading} className="rounded-xl h-12 font-black text-xs uppercase tracking-widest flex-1 shadow-lg shadow-sm">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Valider Flux
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
