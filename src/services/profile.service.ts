'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { CompanyProfile } from '@/lib/types';

class CompanyProfileService {

    async getProfile(): Promise<CompanyProfile | null> {
        const profile = await db.company_profile.toCollection().first();
        if (!profile) {
            const now = new Date();
            const newProfile: CompanyProfile = {
                uuid: uuidv4(),
                companyName: 'Mon Magasin',
                createdAt: now,
                updatedAt: now,
                syncStatus: 'pending',
                version: 1,
                tvaRate: 19,
                isTvaExempt: false,
                invoiceCounter: 1,
                breadCounter: 1,
                proformaCounter: 1,
                breadPrice: 10,
                goldPricePerGram: 0,
                zakatUseSalePrice: true
            };
            const id = await db.company_profile.add(newProfile);
            newProfile.id = id;
            return newProfile;
        }
        return profile;
    }

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
            uuid: profileData.uuid ?? uuidv4(),
            companyName: profileData.companyName ?? 'Mon Magasin',
            ...profileData,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            version: 1
        } as CompanyProfile;
        const id = await db.company_profile.add(newProfile);
        newProfile.id = id;
        return newProfile;
    }
}

export const companyProfileService = new CompanyProfileService();
