/**
 * UserContext — Global state for the authenticated user.
 *
 * Stores: userId, ecoCoins, level, streak.
 * All screens read from this context instead of prop-drilling.
 * Coin balance updates automatically after log/complete actions.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUserProfile, UserProfile } from '../services/api';

interface UserContextType {
  userId: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCoins: (newBalance: number, newLevel: string) => void;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  profile: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
  updateCoins: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      console.warn('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const login = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setUserId(email);
      const data = await getUserProfile(email);
      setProfile(data);
    } catch (err) {
      console.warn('Failed to login:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setProfile(null);
  }, []);

  const updateCoins = useCallback((newBalance: number, newLevel: string) => {
    setProfile((prev) =>
      prev
        ? { ...prev, eco_coins: newBalance, level: newLevel }
        : prev,
    );
  }, []);

  return (
    <UserContext.Provider value={{ userId, profile, isLoading, login, logout, refreshProfile, updateCoins }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
