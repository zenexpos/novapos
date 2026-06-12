'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { CompanyProfile } from '@/lib/types';

/**
 * Service de gestion du profil institutionnel.
 * Gère le cycle de vie du singleton CompanyProfile dans IndexedDB.
 * Respecte strictement l'architecture Offline-First (BaseEntity).
 */
class CompanyProfileService {

    /**
     * Récupère le profil unique. Initialise une entité complète si absente.
     */
    async getProfile(): Promise<CompanyProfile | null> {
        const profile = await db.company_profile.toCollection().first();
        if (!profile) {
            const now = new Date();
            const newProfile: CompanyProfile = {
                uuid:        uuidv4(),
                companyName: 'Mon Magasin',
                createdAt:   now,
                updatedAt:   now,
                syncStatus:  'pending',
                version:     1
            };
            const id = await db.company_profile.add(newProfile);
            newProfile.id = id;
            return newProfile;
        }
        return profile;
    }

    /** 
     * Mise à jour partielle d'un profil existant.
     * Incrémente la version et bascule le statut en 'pending' pour le Sync Engine.
     */
    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await this.getProfile();
        if (!existing?.id) throw new Error('Profil non trouvé');
        
        const updated = { 
            ...profileData, 
            updatedAt: new Date(),
            syncStatus: 'pending' as const,
            version: (existing.version || 1) + 1
        };
        await db.company_profile.update(existing.id, updated);
        return { ...existing, ...updated };
    }

    /**
     * Upsert — crée si absent, met à jour si existant.
     * Garantit qu'aucune propriété de BaseEntity ne manque.
     */
    async upsertProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await db.company_profile.toCollection().first();
        const now = new Date();

        if (existing?.id) {
            const updated = { 
                ...profileData, 
                updatedAt: now,
                syncStatus: 'pending' as const,
                version: (existing.version || 1) + 1
            };
            await db.company_profile.update(existing.id, updated);
            return { ...existing, ...updated };
        }

        const newProfile: CompanyProfile = {
            uuid:        profileData.uuid ?? uuidv4(),
            companyName: profileData.companyName ?? 'Mon Magasin',
            ...profileData,
            createdAt:   now,
            updatedAt:   now,
            syncStatus:  'pending',
            version:     1
        };
        const id = await db.company_profile.add(newProfile);
        newProfile.id = id;
        return newProfile;
    }
}

export const companyProfileService = new CompanyProfileService();
