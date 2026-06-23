import { create } from 'zustand';

import type { WeatherData } from '@/types';

interface WeatherState {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  setWeather: (weather: WeatherData | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  isLoading: false,
  error: null,
  setWeather: (weather) => set({ weather, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
