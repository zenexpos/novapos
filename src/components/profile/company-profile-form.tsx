'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { 
    Loader2, Building, Cloud, Key, ShieldCheck, 
    RotateCcw, Scale, Coins, Wheat, Receipt, Landmark,
    Link as LinkIcon, Eye, EyeOff
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SupabaseSqlDialog } from './SupabaseSqlDialog';

export function CompanyProfileForm() {
    const companyProfile = useAppStore(state => state.companyProfile);
    const isCompanyProfileLoading = useAppStore(state => state.isCompanyProfileLoading);
    const { updateCompanyProfile } = useAppStore(state => state.actions);
    
    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSupabaseKey, setShowSupabaseKey] = useState(false);

    useEffect(() => {
        if (companyProfile) {
            setFormState(companyProfile);
        }
    }, [companyProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormState(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? (value === '' ? undefined : Number(value)) : value 
        }));
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateCompanyProfile(formState);
            toast.success('Profil institutionnel mis à jour.');
        } catch (err) {
            toast.error("Échec de la mise à jour.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isCompanyProfileLoading) {
        return (
            <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-3 w-32 rounded-full bg-muted/20" />
                            <Skeleton className="h-11 w-full rounded-xl bg-muted/20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        );
    }

    const SectionTitle = ({ title, icon: Icon, extra }: { title: string, icon: React.ElementType, extra?: React.ReactNode }) => (
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/10">
                    <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-60">{title}</h4>
            </div>
            {extra}
        </div>
    );

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="p-6 space-y-16">
                
                {/* 1. IDENTITÉ */}
                <div className="space-y-6">
                    <SectionTitle title="Identité & Forme Juridique" icon={Building} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-[10px] font-bold uppercase ml-1 opacity-40">Raison Sociale *</Label>
                            <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg" required disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="legalForm" className="text-[10px] font-bold uppercase ml-1 opacity-40">Forme Juridique</Label>
                            <Input id="legalForm" value={formState.legalForm || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold" placeholder="Ex: SARL, EURL..." disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* 2. CLOUD */}
                <div className="space-y-6 pt-12 border-t border-white/5">
                    <SectionTitle title="Configuration Cloud Saphir" icon={Cloud} extra={<SupabaseSqlDialog />} />
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="supabaseUrl" className="text-[10px] font-bold uppercase text-primary/60 ml-1">URL Supabase</Label>
                                <Input id="supabaseUrl" value={formState.supabaseUrl || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-background border-none shadow-sm font-mono text-xs" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supabaseKey" className="text-[10px] font-bold uppercase text-primary/60 ml-1">Clé d'API</Label>
                                <div className="relative">
                                    <Input id="supabaseKey" type={showSupabaseKey ? 'text' : 'password'} value={formState.supabaseKey || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-background border-none shadow-sm font-mono text-xs pr-10" disabled={isSaving}/>
                                    <button type="button" onClick={() => setShowSupabaseKey(!showSupabaseKey)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">{showSupabaseKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. BREAD & ZAKAT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-white/5">
                    <div className="space-y-6">
                        <SectionTitle title="Logistique Pain" icon={Wheat} />
                        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                            <Label htmlFor="breadPrice" className="text-[10px] font-black uppercase tracking-wider">Tarif Unitaire Pain</Label>
                            <Input id="breadPrice" type="number" value={formState.breadPrice || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-emerald-600 text-center" disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <SectionTitle title="Zakat Elite" icon={Scale} />
                        <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-4">
                            <Label htmlFor="goldPricePerGram" className="text-[10px] font-black uppercase tracking-wider">Cours de l'Or (g)</Label>
                            <Input id="goldPricePerGram" type="number" value={formState.goldPricePerGram || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-amber-600 text-center" disabled={isSaving}/>
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-6 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                <Button type="submit" className="h-11 px-14 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 gap-3" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4" />}
                    Enregistrer Profil
                </Button>
            </CardFooter>
        </form>
    );
}
