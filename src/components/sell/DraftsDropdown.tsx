'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCartStore, useCartActions } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
    FileStack,
    Plus,
    Trash2,
    Edit,
    PauseCircle,
    Check,
    ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function DraftsDropdown() {
    // SELECTOR OPTIMIZATION: Subscribe only to necessary store slices
    const carts = useCartStore(state => state.carts);
    const activeCartId = useCartStore(state => state.activeCartId);
    const { createCart, selectCart, deleteCart, renameCart } = useCartActions();

    const [isMounted, setIsMounted] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [cartToRename, setCartToRename] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const shortcutConfigs = useMemo(
        () =>
            [1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => ({
                key: String(num),
                alt: true,
                action: () => {
                    const targetCart = carts[num - 1];
                    if (targetCart) {
                        selectCart(targetCart.id);
                        toast.success(`Passage à : ${targetCart.name}`);
                    }
                },
                description: `Aller au panier ${num}`,
                ignoreInputFocus: true,
            })),
        [carts, selectCart],
    );

    useKeyboardShortcuts(shortcutConfigs, 'GestionPaniers', isMounted);

    const handleRename = () => {
        if (cartToRename && newName.trim()) {
            renameCart(cartToRename.id, newName.trim());
            toast.success('Panier renommé.');
        }
        setRenameDialogOpen(false);
        setCartToRename(null);
        setNewName('');
    };

    const handleSuspendAndNew = () => {
        createCart();
        toast.success('Vente actuelle mise en attente. Nouveau panier créé.');
    };

    if (!isMounted) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="h-9 opacity-50 cursor-not-allowed"
            >
                <FileStack className="h-4 w-4 mr-1.5" />
                Ventes
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
                        <FileStack className="h-4 w-4 text-primary" />
                        <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-tight">Ventes</span>
                        {carts.length > 1 && (
                            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4">
                                {carts.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64 rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-md">
                    <DropdownMenuLabel className="flex items-center justify-between p-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Paniers actifs</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-primary font-black uppercase hover:bg-primary/10"
                            onClick={() => createCart()}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Nouveau
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="opacity-10" />

                    {carts.map(cart => {
                        const totals  = calculateCartTotals(cart);
                        const isActive = cart.id === activeCartId;
                        return (
                            <DropdownMenuItem
                                key={cart.id}
                                className={cn(
                                    'flex items-center justify-between cursor-pointer p-3 m-1 rounded-xl transition-all',
                                    isActive ? 'bg-primary/10 text-primary font-black' : 'hover:bg-muted/50',
                                )}
                                onSelect={() => selectCart(cart.id)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {isActive ? (
                                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    ) : (
                                        <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-30" />
                                    )}
                                    <span className="truncate text-xs font-bold uppercase tracking-tight">{cart.name}</span>
                                    {cart.items.length > 0 && (
                                        <span className="text-[10px] text-muted-foreground/40 shrink-0 font-bold">
                                            ({cart.items.length})
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                    {totals.total > 0 && (
                                        <span className="text-[10px] font-black text-primary tabular-nums">
                                            {formatCurrency(totals.total)}
                                        </span>
                                    )}
                                    <button
                                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setCartToRename({ id: cart.id, name: cart.name });
                                            setNewName(cart.name);
                                            setRenameDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-3 w-3 text-muted-foreground/40" />
                                    </button>
                                    <button
                                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                        onClick={e => {
                                            e.stopPropagation();
                                            deleteCart(cart.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive/40" />
                                    </button>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}

                    <DropdownMenuSeparator className="opacity-10" />
                    <DropdownMenuItem
                        onSelect={handleSuspendAndNew}
                        className="text-primary font-black uppercase text-[10px] p-4 m-1 rounded-xl gap-3 tracking-widest hover:bg-primary/5"
                    >
                        <PauseCircle className="h-4 w-4" />
                        Mettre en attente & Nouveau
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Personnaliser la vente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Attribuez un nom à ce panier pour faciliter le suivi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleRename();
                        }}
                        className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                        autoFocus
                    />
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename} className="rounded-xl font-black uppercase text-xs">
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
