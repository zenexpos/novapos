'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanyProfile } from '@/lib/types';
import { companyProfileService } from '@/services/profile.service';
import { toast } from 'sonner';

interface ProfileState {
  profile: CompanyProfile | null;
  isLoading: boolean;
  actions: {
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: false,
      actions: {
        fetchProfile: async () => {
          set({ isLoading: true });
          try {
            const profile = await companyProfileService.getProfile();
            set({ profile });
          } finally {
            set({ isLoading: false });
          }
        },
        updateProfile: async (data) => {
          try {
            const updated = await companyProfileService.upsertProfile(data);
            set({ profile: updated });
            toast.success('Profil établissement mis à jour');
          } catch (e) {
            toast.error('Échec de la mise à jour');
          }
        }
      }
    }),
    { name: 'ipos-profile-storage' }
  )
);

export const useProfile = () => useProfileStore(state => state.profile);
export const useProfileActions = () => useProfileStore(state => state.actions);
