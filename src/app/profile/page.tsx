'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/profile/company-profile-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/stores/appStore";
import { Building, MapPin, Phone, Globe, ShieldCheck, Share2, Sparkles, Star, Cloud, Landmark, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

/**
 * Page de gestion du profil institutionnel.
 * Permet de configurer l'identité légale de l'établissement pour la facturation et les rapports.
 */
export default function ProfilePage() {
    const { companyProfile, isCompanyProfileLoading } = useAppStore(state => ({
        companyProfile: state.companyProfile,
        isCompanyProfileLoading: state.isCompanyProfileLoading,
    }));

    return (
        <div className="p-6 sm:p-4 space-y-4 max-w-6xl mx-auto pb-32 animate-in fade-in duration-1000">
            <PageHeader 
                title="Identité Institutionnelle"
                description="Configuration souveraine de l'établissement pour documents officiels"
            />

            <div className="relative group animate-in slide-in-from-top-8 duration-1000">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/60 via-primary/5 to-transparent rounded-lg blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <Card className="relative rounded-lg border-white/5 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden group-hover:border-primary/20 transition-all duration-700">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
                        <Share2 className="h-60 w-60 rotate-12" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                            <div className="relative">
                                <div className="relative h-32 w-32 rounded-2xl bg-black/40 flex items-center justify-center text-primary border border-white/5 shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-all duration-700">
                                    <Building className="h-12 w-12" />
                                </div>
                            </div>
                            
                            <div className="flex-grow space-y-6">
                                {isCompanyProfileLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-80 rounded-2xl bg-muted/20" />
                                        <Skeleton className="h-6 w-96 rounded-xl bg-muted/20" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em]">Établissement Enregistré</p>
                                            <h2 className="text-3xl font-black tracking-tighter text-primary group-hover:scale-[1.01] transition-transform origin-left">
                                                {companyProfile?.companyName || 'Établissement non identifié'}
                                            </h2>
                                            {companyProfile?.legal_form && (
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                                                    Forme : {companyProfile.legal_form}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner group-hover:border-primary/10 transition-colors">
                                                <MapPin className="h-4 w-4 text-primary/60" />
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide leading-none">
                                                    {companyProfile?.city ? `${companyProfile.city}, ALGÉRIE` : 'Localisation Inconnue'}
                                                </span>
                                            </div>
                                            {companyProfile?.phone && (
                                                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner group-hover:border-primary/10 transition-colors">
                                                    <Phone className="h-4 w-4 text-primary/60" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide leading-none">
                                                        {companyProfile.phone}
                                                    </span>
                                                </div>
                                            )}
                                            {companyProfile?.nif && (
                                                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 backdrop-blur-md shadow-inner">
                                                    <Hash className="h-4 w-4 text-primary/60" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">
                                                        NIF: {companyProfile.nif}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hidden xl:flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center min-w-[240px] backdrop-blur-sm relative overflow-hidden group/status">
                                <Sparkles className="absolute -right-4 -top-4 h-16 w-16 text-emerald-500/10 group-hover/status:opacity-30 transition-opacity" />
                                <p className="text-[9px] font-black uppercase text-emerald-600/60 mb-1 relative z-10 tracking-[0.2em]">Certification Elite</p>
                                <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-6 py-3 rounded-2xl w-full border border-emerald-500/20 relative z-10 shadow-sm">
                                    <ShieldCheck className="h-4 w-4" /> Actif & Conforme
                                </div>
                                
                                {companyProfile?.last_sync_at && (
                                    <div className="mt-4 pt-4 border-t border-emerald-500/10 w-full animate-in fade-in duration-700">
                                        <p className="text-[8px] font-bold uppercase text-muted-foreground/40 mb-1.5 flex items-center justify-center gap-1.5">
                                            <Cloud className="h-2.5 w-2.5" /> Synchronisation Cloud
                                        </p>
                                        <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-tighter">
                                            {format(new Date(companyProfile.last_sync_at), 'd MMM yyyy, HH:mm', { locale: fr })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Card className="rounded-lg border border-white/5 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl">
                                <Star className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter">Configuration des Registres</CardTitle>
                                <CardDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
                                    Définissez les paramètres légaux et les compteurs de facturation.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CompanyProfileForm />
                </Card>
            </div>
        </div>
    );
}
