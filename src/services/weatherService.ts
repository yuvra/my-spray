import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions, isFirebaseConfigured } from '@/lib/firebase';
import {
  openWeatherIconUrl,
  wmoConditionType,
  wmoDescription,
  wmoIconCode,
} from '@/services/weather/wmo';
import type { WeatherData } from '@/types';

type OpenMeteoCurrent = {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  precipitation_probability?: number;
  wind_speed_10m?: number;
  weather_code?: number;
  is_day?: number;
};

type OpenMeteoForecast = {
  current?: OpenMeteoCurrent;
};

type OpenMeteoReverse = {
  results?: Array<{
    name?: string;
    admin1?: string;
    country?: string;
  }>;
};

function mapOpenMeteoLanguage(language: string): string {
  if (language === 'hi' || language === 'mr') return language;
  return 'en';
}

async function reverseGeocodeOpenMeteo(
  lat: number,
  lon: number,
  language = 'en',
): Promise<string> {
  const lang = mapOpenMeteoLanguage(language);
  const url =
    `https://geocoding-api.open-meteo.com/v1/reverse` +
    `?latitude=${lat}&longitude=${lon}&language=${encodeURIComponent(lang)}`;

  const response = await fetch(url);
  const data = (await response.json()) as OpenMeteoReverse;
  const place = data.results?.[0];

  if (!place?.name) {
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }

  if (place.admin1 && place.admin1 !== place.name) {
    return `${place.name}, ${place.admin1}`;
  }

  return place.name;
}

function mapOpenMeteoWeather(data: OpenMeteoCurrent, locationName: string): WeatherData {
  const weatherCode = data.weather_code ?? 3;
  const isDaytime = (data.is_day ?? 1) === 1;
  const iconCode = wmoIconCode(weatherCode, isDaytime);

  return {
    temp: Math.round(data.temperature_2m ?? 0),
    feelsLike: Math.round(data.apparent_temperature ?? data.temperature_2m ?? 0),
    humidity: Math.round(data.relative_humidity_2m ?? 0),
    rainProbability: Math.round(data.precipitation_probability ?? 0),
    windSpeed: Math.round(data.wind_speed_10m ?? 0),
    description: wmoDescription(weatherCode),
    icon: openWeatherIconUrl(iconCode),
    conditionType: wmoConditionType(weatherCode),
    isDaytime,
    locationName,
    fetchedAt: new Date().toISOString(),
  };
}

/** Free weather via Open-Meteo (no API key required). */
export async function fetchOpenMeteoWeather(
  lat: number,
  lon: number,
  language = 'en',
): Promise<WeatherData> {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code,is_day` +
    `&timezone=auto&forecast_days=1`;

  const [weatherResponse, locationName] = await Promise.all([
    fetch(weatherUrl),
    reverseGeocodeOpenMeteo(lat, lon, language),
  ]);

  if (!weatherResponse.ok) {
    throw new Error('Open-Meteo weather request failed');
  }

  const payload = (await weatherResponse.json()) as OpenMeteoForecast;
  if (!payload.current) {
    throw new Error('Open-Meteo returned no current weather');
  }

  return mapOpenMeteoWeather(payload.current, locationName);
}

export async function fetchWeather(
  lat: number,
  lon: number,
  language = 'en',
): Promise<WeatherData> {
  try {
    return await fetchOpenMeteoWeather(lat, lon, language);
  } catch (error) {
    if (__DEV__) {
      console.warn('[weather] Open-Meteo direct failed:', error);
    }
  }

  if (isFirebaseConfigured) {
    try {
      const callable = httpsCallable<{ lat: number; lon: number; language?: string }, WeatherData>(
        getFirebaseFunctions(),
        'getWeather',
      );
      const result = await callable({ lat, lon, language });
      return result.data;
    } catch (error) {
      if (__DEV__) {
        console.warn('[weather] Cloud Function failed:', error);
      }
    }
  }

  throw new Error('Weather unavailable. Check your internet connection.');
}

export function getSprayAdvisory(weather: WeatherData): 'avoid' | 'good' {
  if (weather.rainProbability > 50 || weather.humidity > 80 || weather.windSpeed > 25) {
    return 'avoid';
  }
  return 'good';
}

type AdvisoryT = (key: string) => string;

/** Detailed spray advisory text for info popup */
export function getSprayAdvisoryMessage(weather: WeatherData, t: AdvisoryT): string {
  const lines: string[] = [
    `${t('home.humidity')}: ${weather.humidity}%`,
    `${t('home.rain')}: ${weather.rainProbability}%`,
    `${t('home.wind')}: ${weather.windSpeed} km/h`,
  ];

  if (weather.rainProbability > 50) lines.push(`• ${t('home.advisoryRain')}`);
  if (weather.humidity > 80) lines.push(`• ${t('home.advisoryHumidity')}`);
  if (weather.windSpeed > 25) lines.push(`• ${t('home.advisoryWind')}`);
  if (getSprayAdvisory(weather) === 'good') lines.push(`• ${t('home.advisoryGoodDetail')}`);

  return lines.join('\n');
}
