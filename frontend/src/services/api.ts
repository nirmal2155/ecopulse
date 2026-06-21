/**
 * Axios API client — all backend communication goes through here.
 *
 * BASE_URL: Change this to your machine's local IP when testing on a
 * physical device (Expo Go can't use 'localhost').
 *
 * Example: 'http://192.168.1.5:8000'
 */

import axios from 'axios';

// ⚠️  Replace with your local IP if testing on a physical device
export const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityItem {
  category: 'transport' | 'food';
  type: string;
  quantity: number;
}

export interface CarbonResult {
  total_kg: number;
  breakdown: { transport_kg: number; food_kg: number };
  hot_spot: string;
  vs_global_avg: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  coins_reward: number;
  category: string;
  completed: boolean;
}

export interface ActivityLogResponse {
  footprint: CarbonResult;
  challenges: Challenge[];
  coins_earned: number;
  new_balance: number;
  streak_days: number;
  level: string;
  ai_powered: boolean;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  eco_coins: number;
  level: string;
  streak_days: number;
  logs_count: number;
  total_footprint_kg: number;
  level_progress: {
    current: string;
    next: string | null;
    progress_pct: number;
    coins_to_next: number;
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const logActivities = async (
  userId: string,
  activities: ActivityItem[],
): Promise<ActivityLogResponse> => {
  const { data } = await api.post('/api/activities/log', {
    user_id: userId,
    activities,
  });
  return data;
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data } = await api.get(`/api/users/${userId}/profile`);
  return data;
};

export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  const { data } = await api.get(`/api/challenges/${userId}`);
  return data;
};

export const completeChallenge = async (
  challengeId: string,
  userId: string,
): Promise<{ coins_earned: number; new_balance: number; new_level: string }> => {
  const { data } = await api.post(
    `/api/challenges/${challengeId}/complete?user_id=${userId}`,
  );
  return data;
};

export const getHistory = async (userId: string): Promise<any[]> => {
  const { data } = await api.get(`/api/activities/history/${userId}`);
  return data;
};

export default api;
