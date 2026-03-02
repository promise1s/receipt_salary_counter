
import { UserProfile, WishItem } from '../types';

const PROFILE_KEY = 'salary_receipt_profile';
const WISHES_KEY = 'salary_receipt_wishes';

export const storage = {
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
  loadProfile: (): UserProfile | null => {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  },
  saveWishes: (wishes: WishItem[]) => {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
  },
  loadWishes: (): WishItem[] => {
    const data = localStorage.getItem(WISHES_KEY);
    return data ? JSON.parse(data) : [];
  }
};
