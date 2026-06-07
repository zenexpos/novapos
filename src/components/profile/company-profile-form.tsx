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
    Loader2, Building, MapPin, Phone, Mail, Wheat, Coins, 
    FileText, CheckCircle2, RotateCcw, Hash, Cloud, Key, 
    ShieldCheck, Landmark, Receipt, Percent, Globe, Link as LinkIcon,
    Sparkles, Eye, EyeOff, Scale
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SupabaseSqlDialog } from './SupabaseSqlDialog';

/**
 * Formulaire de configuration du profil établissement iPOS Zen.
 * Inclut désormais les paramètres Cloud (Supabase) et les références de prix (Or/Pain).
 */
export function CompanyProfileForm() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));
    const { updateCompanyProfile } = useAppStore(state => state.actions);
    
    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (companyProfile) {
            setFormState(companyProfile);
        }
    }, [companyProfile]);

    const [showSupabaseKey, setShowSupabaseKey] = useState(false);

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

    const handleReset = () => {
        if (companyProfile) {
            setFormState(companyProfile);
            toast.info("Modifications révoquées.");
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
                
                {/* 1. IDENTITÉ & STRUCTURE */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SectionTitle title="Identité & Forme Juridique" icon={Building} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-[10px] font-bold uppercase ml-1 opacity-40">Raison Sociale *</Label>
                            <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-black text-lg focus-visible:ring-primary/20" required disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="legal_form" className="text-[10px] font-bold uppercase ml-1 opacity-40">Formه Juridique</Label>
                            <Input id="legal_form" value={formState.legal_form || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" placeholder="Ex: SARL, EURL, EI, Auto-entrepreneur..." disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address" className="text-[10px] font-bold uppercase ml-1 opacity-40">Siège Social</Label>
                            <Input id="address" value={formState.address || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" placeholder="Adresse complète..." disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-[10px] font-bold uppercase ml-1 opacity-40">Ville / Wilaya</Label>
                            <Input id="city" value={formState.city || ''} onChange={handleInputChange} className="h-12 rounded-xl bg-black/20 border-none shadow-inner font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* 2. CONFIGURATION CLOUD SAPHIR (SUPABASE) */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <SectionTitle 
                        title="Configuration Cloud Saphir" 
                        icon={Cloud} 
                        extra={<SupabaseSqlDialog />}
                    />
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-6 relative overflow-hidden group">
                        <Cloud className="absolute -right-6 -top-6 h-32 w-32 text-primary/5 group-hover:opacity-10 transition-opacity duration-1000" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-2">
                                <Label htmlFor="supabase_url" className="text-[10px] font-bold uppercase text-primary/60 ml-1">URL du Projet Supabase</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                    <Input 
                                        id="supabase_url" 
                                        value={formState.supabase_url || ''} 
                                        onChange={handleInputChange} 
                                        className="pl-11 h-11 rounded-xl bg-background border-none shadow-sm font-mono text-xs font-bold" 
                                        placeholder="https://xxxxxx.supabase.co"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supabase_key" className="text-[10px] font-bold uppercase text-primary/60 ml-1">Clé d'API (Service Role / Anon)</Label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                    <Input
                                        id="supabase_key"
                                        type={showSupabaseKey ? 'text' : 'password'}
                                        value={formState.supabase_key || ''}
                                        onChange={handleInputChange}
                                        className="pl-11 pr-11 h-11 rounded-xl bg-background border-none shadow-sm font-mono text-xs font-bold"
                                        placeholder="votre_cle_secrete..."
                                        disabled={isSaving}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowSupabaseKey(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={showSupabaseKey ? 'Masquer la clé' : 'Afficher la clé'}
                                    >
                                        {showSupabaseKey
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground/60 italic leading-relaxed max-w-2xl px-1">
                            Ces identifiants permettent à iPOS Zen de synchroniser votre base de données locale avec votre propre instance Supabase. Les données sont chiffrées durant le transport.
                        </p>
                    </div>
                </div>

                {/* 3. LOGISTIQUE & RÉFÉRENCES */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <SectionTitle title="Logistique & Unités" icon={Wheat} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4 group hover:bg-emerald-500/10 transition-all shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <Wheat className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <Label htmlFor="prix_pain" className="text-[10px] font-black uppercase tracking-wider">Tarif Unitaire Pain</Label>
                                    <span className="text-[8px] text-emerald-600/60 font-bold">Prix appliqué aux abonnements logistiques</span>
                                </div>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="prix_pain" 
                                    type="number" 
                                    value={formState.prix_pain || ''} 
                                    onChange={handleInputChange} 
                                    className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-emerald-600 text-center focus-visible:ring-emerald-500/20" 
                                    placeholder="0.00"
                                    disabled={isSaving}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xs text-emerald-600/30">DA / pcs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. PARAMÈTRES ZAKAT ELITE */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <SectionTitle title="Paramètres Zakat & Seuil Nissab" icon={Scale} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-4 group hover:bg-amber-500/10 transition-all shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <Label htmlFor="goldPricePerGram" className="text-[10px] font-black uppercase tracking-wider">Cours de l'Or (24k)</Label>
                                    <span className="text-[8px] text-amber-600/60 font-bold">Base du calcul du Nissab (85g)</span>
                                </div>
                            </div>
                            <div className="relative">
                                <Input 
                                    id="goldPricePerGram" 
                                    type="number" 
                                    value={formState.goldPricePerGram || ''} 
                                    onChange={handleInputChange} 
                                    className="h-12 rounded-xl bg-background border-none shadow-sm font-black text-xl text-amber-600 text-center focus-visible:ring-amber-500/20" 
                                    placeholder="0.00"
                                    disabled={isSaving}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xs text-amber-600/30">DA / g</span>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-wider">Méthode d'Évaluation</Label>
                                    <p className="text-[9px] text-muted-foreground/60 leading-tight">Valorisation du stock pour l'assiette imposable</p>
                                </div>
                                <Switch 
                                    checked={formState.zakat_use_sale_price ?? true}
                                    onCheckedChange={(checked) => setFormState(prev => ({ ...prev, zakat_use_sale_price: checked }))}
                                    className="data-[state=checked]:bg-primary"
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 text-[10px] font-bold">
                                {formState.zakat_use_sale_price ?? true ? (
                                    <span className="text-emerald-500">Prix de Vente (Recommandé)</span>
                                ) : (
                                    <span className="text-amber-500">Prix d'Achat (PMP)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. IDENTIFIANTS FISCAUX ALGÉRIENS */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                    <SectionTitle title="Régime Fiscal & Identifiants" icon={Landmark} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="rc_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Reg. Commerce (RC)</Label>
                            <Input id="rc_number" value={formState.rc_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" placeholder="WW/BB-NNNNNNN" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nif" className="text-[10px] font-bold uppercase ml-1 opacity-40">Ident. Fiscale (NIF)</Label>
                            <Input id="nif" value={formState.nif || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" placeholder="15 chiffres" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Art. Imposition (AI)</Label>
                            <Input id="ai_number" value={formState.ai_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nis_number" className="text-[10px] font-bold uppercase ml-1 opacity-40">Statistique (NIS)</Label>
                            <Input id="nis_number" value={formState.nis_number || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold focus-visible:ring-primary/20" disabled={isSaving}/>
                        </div>
                    </div>
                </div>

                {/* 6. SÉQUENÇAGE & FACTURATION */}
                <div className="space-y-6 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                    <SectionTitle title="Facturation & Contacts" icon={Receipt} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-2xl border border-white/5 shadow-inner">
                            <div className="space-y-2">
                                <Label htmlFor="invoice_prefix" className="text-[10px] font-bold uppercase ml-1 opacity-40">Préfixe Facture</Label>
                                <Input id="invoice_prefix" value={formState.invoice_prefix || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold" placeholder="2025" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice_counter" className="text-[10px] font-bold uppercase ml-1 opacity-40">Prochain N°</Label>
                                <Input id="invoice_counter" type="number" value={formState.invoice_counter || 1} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold text-emerald-500" disabled={isSaving}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase ml-1 opacity-40">Téléphone</Label>
                                <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-bold" disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase ml-1 opacity-40">E-mail</Label>
                                <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} className="h-11 rounded-xl bg-black/20 border-none shadow-inner font-bold" disabled={isSaving}/>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="p-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Configuration Elite Active</p>
                    </div>
                    {formState.updatedAt && (
                        <p className="text-[9px] font-bold text-muted-foreground/30 italic ml-4">
                            Dernière mise à jour : {format(new Date(formState.updatedAt), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </p>
                    )}
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} className="h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-white/5" disabled={isSaving}>
                        <RotateCcw className="h-4 w-4 opacity-40" /> Annuler
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none h-11 px-14 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 gap-3" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4" />}
                        Enregistrer Profil
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}
