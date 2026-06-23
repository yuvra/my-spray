/** WMO weather code descriptions (Open-Meteo) */
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

export function wmoDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

export function wmoConditionType(code: number): string {
  if (code === 0) return 'CLEAR';
  if (code === 1) return 'MOSTLY_CLEAR';
  if (code === 2) return 'PARTLY_CLOUDY';
  if (code === 3) return 'OVERCAST';
  if (code === 45 || code === 48) return 'FOG';
  if (code >= 51 && code <= 57) return 'DRIZZLE';
  if (code >= 61 && code <= 67) return 'RAIN';
  if (code >= 71 && code <= 77) return 'SNOW';
  if (code >= 80 && code <= 82) return 'RAIN_SHOWERS';
  if (code >= 85 && code <= 86) return 'SNOW';
  if (code >= 95) return 'THUNDERSTORM';
  return 'CLOUDY';
}

/** Map WMO code to OpenWeatherMap-style icon id for free icon CDN */
export function wmoIconCode(code: number, isDaytime: boolean): string {
  const suffix = isDaytime ? 'd' : 'n';
  if (code === 0) return `01${suffix}`;
  if (code === 1 || code === 2) return `02${suffix}`;
  if (code === 3) return `04${suffix}`;
  if (code === 45 || code === 48) return `50${suffix}`;
  if (code >= 51 && code <= 57) return `09${suffix}`;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return `10${suffix}`;
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return `13${suffix}`;
  if (code >= 95) return `11${suffix}`;
  return `03${suffix}`;
}

export function openWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
