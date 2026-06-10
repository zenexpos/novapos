'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { CompanyProfile } from '@/lib/types';

/**
 * Service de gestion du profil institutionnel.
 * Gère le cycle de vie du singleton CompanyProfile dans IndexedDB.
 */
class CompanyProfileService {

    async getProfile(): Promise<CompanyProfile | null> {
        const profile = await db.company_profile.toCollection().first();
        if (!profile) {
            const newProfile: CompanyProfile = {
                uuid:        uuidv4(),
                companyName: 'Mon Magasin',
                updatedAt:   new Date(),
            };
            const id = await db.company_profile.add(newProfile);
            newProfile.id = id;
            return newProfile;
        }
        return profile;
    }

    /** Update existing profile (partial). Throws if not found. */
    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await this.getProfile();
        if (!existing?.id) throw new Error('Profil non trouvé');
        const updated = { ...profileData, updatedAt: new Date() };
        await db.company_profile.update(existing.id, updated);
        return { ...existing, ...updated };
    }

    /**
     * Upsert — crée si absent, met à jour si existant.
     * Utilisé par appStore.updateCompanyProfile().
     */
    async upsertProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await db.company_profile.toCollection().first();
        if (existing?.id) {
            const updated = { ...profileData, updatedAt: new Date() };
            await db.company_profile.update(existing.id, updated);
            return { ...existing, ...updated };
        }
        const newProfile: CompanyProfile = {
            uuid:        profileData.uuid ?? uuidv4(),
            companyName: profileData.companyName ?? 'Mon Magasin',
            ...profileData,
            updatedAt: new Date(),
        };
        const id = await db.company_profile.add(newProfile);
        newProfile.id = id;
        return newProfile;
    }
}

export const companyProfileService = new CompanyProfileService();
