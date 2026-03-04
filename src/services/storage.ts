
import { UserProfile, WishItem } from '../types';

export const storage = {
  saveProfile: async (profile: UserProfile): Promise<void> => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  },
  loadProfile: async (): Promise<UserProfile | null> => {
    try {
      const response = await fetch('/api/profile/latest');
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to load profile:', error);
      return null;
    }
  },
  saveWishes: async (wishes: WishItem[]): Promise<void> => {
    try {
      await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wishes),
      });
    } catch (error) {
      console.error('Failed to save wishes:', error);
    }
  },
  loadWishes: async (): Promise<WishItem[]> => {
    try {
      const response = await fetch('/api/wishes/latest');
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to load wishes:', error);
      return [];
    }
  }
};
